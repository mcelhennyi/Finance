"""Single-month unified summary: goals/budgets, card cash flow, income/liability contracts, net worth view."""

from dataclasses import dataclass, field
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import func
from sqlalchemy.orm import Session

from finance.analysis.service import compute_metrics, get_merchant_display_overrides, get_transactions
from finance.db.models import Budget, Goal, IncomeRecord, Transaction
from finance.goals.service import BudgetActual, GoalProgress, GoalsActualsService
from finance.ingestion.contracts import aggregate_income_liabilities, list_income_records, list_liability_records

_OPERATING_TOLERANCE = 10.0


@dataclass(frozen=True)
class BudgetSummaryItem:
    budget_id: int
    category: str
    period_month: date
    budget_amount: float
    actual: float
    variance: float
    is_over_budget: bool
    is_incomplete_month: bool
    trending_over_budget: bool


@dataclass(frozen=True)
class GoalSummaryItem:
    goal_id: int
    name: str
    goal_type: str
    period_month: date
    target: float
    actual: float
    remaining: float
    progress_ratio: float
    is_complete: bool


@dataclass(frozen=True)
class CardCashFlow:
    total_charges: float
    total_credits: float
    net_spent: float
    transaction_count: int
    by_category: dict[str, float] = field(default_factory=dict)


@dataclass(frozen=True)
class ContractAggregateSummary:
    total_income: float
    total_liabilities: float
    net_cash_after_liabilities: float
    active_income_count: int
    active_liability_count: int


@dataclass(frozen=True)
class LiabilityLineItem:
    id: int
    name: str
    liability_type: str
    principal_amount: float
    as_of_date: date
    currency: str


@dataclass(frozen=True)
class NetWorthBreakdown:
    """Phase 2 snapshot: external assets are not yet modeled; liabilities come from contract records."""

    assets_total: float
    assets_tracked: bool
    liabilities_total: float
    net_worth: float
    liability_line_items: list[LiabilityLineItem]


@dataclass(frozen=True)
class Reconciliation:
    """Unified operating line vs independent recomputation; operational tolerance is USD 10 (FR-0001)."""

    unified_operating_net: float
    independent_operating_net: float
    discrepancy: float
    within_tolerance: bool
    income_aggregate_vs_line_items: float
    within_tolerance_income: bool


@dataclass(frozen=True)
class UnifiedMonthlySummary:
    period_month: date
    as_of: date
    budgets: list[BudgetSummaryItem]
    goals: list[GoalSummaryItem]
    card_cash_flow: CardCashFlow
    contracts: ContractAggregateSummary
    net_worth: NetWorthBreakdown
    reconciliation: Reconciliation
    currency: str = "USD"


def normalize_period_month(period_month: date) -> date:
    return period_month.replace(day=1)


def _month_window(anchor: date) -> tuple[date, date]:
    month_start = anchor.replace(day=1)
    next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
    return month_start, next_month - timedelta(days=1)


def _sum_income_for_month(session: Session, start: date, end: date) -> float:
    q = (
        session.query(func.coalesce(func.sum(IncomeRecord.amount), 0))
        .filter(
            IncomeRecord.deleted_at.is_(None),
            IncomeRecord.income_date >= start,
            IncomeRecord.income_date <= end,
        )
    )
    v = q.scalar() or 0
    if isinstance(v, Decimal):
        return float(v)
    return float(v)


def _independent_operating_line(
    session: Session,
    month_start: date,
    month_end: date,
    total_credits: float,
    total_spent: float,
) -> float:
    income = _sum_income_for_month(session, month_start, month_end)
    return round(income + total_credits - total_spent, 2)


def _budget_to_item(b: Budget, actual: BudgetActual) -> BudgetSummaryItem:
    return BudgetSummaryItem(
        budget_id=b.id,
        category=b.category,
        period_month=b.period_month,
        budget_amount=actual.budget_amount,
        actual=actual.actual,
        variance=actual.variance,
        is_over_budget=actual.is_over_budget,
        is_incomplete_month=actual.is_incomplete_month,
        trending_over_budget=actual.trending_over_budget,
    )


def _goal_to_item(g: Goal, prog: GoalProgress) -> GoalSummaryItem:
    return GoalSummaryItem(
        goal_id=g.id,
        name=g.name,
        goal_type=g.goal_type,
        period_month=g.period_month,
        target=prog.target,
        actual=prog.actual,
        remaining=prog.remaining,
        progress_ratio=prog.progress_ratio,
        is_complete=prog.is_complete,
    )


def _list_budgets_for_month(session: Session, period_month: date) -> list[Budget]:
    return (
        session.query(Budget)
        .filter(Budget.period_month == period_month)
        .order_by(Budget.category, Budget.id)
        .all()
    )


def _list_goals_for_month(session: Session, period_month: date) -> list[Goal]:
    return (
        session.query(Goal)
        .filter(Goal.period_month == period_month)
        .order_by(Goal.name, Goal.id)
        .all()
    )


def build_unified_monthly_summary(
    session: Session,
    period_month: date,
    as_of: date | None = None,
) -> UnifiedMonthlySummary:
    """Assemble a single response combining goals/budgets, card metrics, and income/liability contracts."""
    pm = normalize_period_month(period_month)
    month_start, month_end = _month_window(pm)
    as_of_effective = as_of or date.today()
    as_of_capped = min(max(as_of_effective, month_start), month_end)

    txns: list[Transaction] = get_transactions(
        session=session,
        date_from=month_start,
        date_to=month_end,
        include_credits=True,
    )
    merchant_over = get_merchant_display_overrides(session)
    metrics = compute_metrics(txns, merchant_display_overrides=merchant_over)
    by_cat = {k: round(v, 2) for k, v in metrics.by_category.items()}

    card = CardCashFlow(
        total_charges=round(metrics.total_spent, 2),
        total_credits=round(metrics.total_credits, 2),
        net_spent=round(metrics.net_spent, 2),
        transaction_count=metrics.transaction_count,
        by_category=by_cat,
    )

    agg = aggregate_income_liabilities(session, from_date=month_start, to_date=month_end)
    contracts = ContractAggregateSummary(
        total_income=agg.total_income,
        total_liabilities=agg.total_liabilities,
        net_cash_after_liabilities=agg.net_cash_after_liabilities,
        active_income_count=agg.active_income_count,
        active_liability_count=agg.active_liability_count,
    )

    svc = GoalsActualsService()
    budget_items: list[BudgetSummaryItem] = []
    for b in _list_budgets_for_month(session, pm):
        actual = svc.compute_budget_actual(b, txns, as_of=as_of_capped)
        budget_items.append(_budget_to_item(b, actual))

    goal_items: list[GoalSummaryItem] = []
    for g in _list_goals_for_month(session, pm):
        prog = svc.compute_goal_progress(g, txns)
        goal_items.append(_goal_to_item(g, prog))

    # Net worth: only liabilities are contract-backed; assets are a placeholder until account balances exist.
    liab_rows = list_liability_records(session, from_date=month_start, to_date=month_end)
    liability_line_items = [
        LiabilityLineItem(
            id=r.id,
            name=r.name,
            liability_type=r.liability_type,
            principal_amount=float(r.principal_amount),
            as_of_date=r.as_of_date,
            currency=r.currency,
        )
        for r in liab_rows
    ]
    assets_total = 0.0
    assets_tracked = False
    net_w = NetWorthBreakdown(
        assets_total=assets_total,
        assets_tracked=assets_tracked,
        liabilities_total=contracts.total_liabilities,
        net_worth=round(assets_total - contracts.total_liabilities, 2),
        liability_line_items=liability_line_items,
    )

    unified_op = round(contracts.total_income + card.total_credits - card.total_charges, 2)
    indep = _independent_operating_line(
        session, month_start, month_end, card.total_credits, card.total_charges
    )
    disc = round(unified_op - indep, 2)

    line_income = _sum_income_for_month(session, month_start, month_end)
    rows = list_income_records(session, from_date=month_start, to_date=month_end)
    manual = sum(float(r.amount) for r in rows)
    income_disc = round(line_income - manual, 2)

    rec = Reconciliation(
        unified_operating_net=unified_op,
        independent_operating_net=indep,
        discrepancy=disc,
        within_tolerance=abs(disc) <= _OPERATING_TOLERANCE,
        income_aggregate_vs_line_items=income_disc,
        within_tolerance_income=abs(income_disc) <= _OPERATING_TOLERANCE,
    )

    return UnifiedMonthlySummary(
        period_month=pm,
        as_of=as_of_capped,
        budgets=budget_items,
        goals=goal_items,
        card_cash_flow=card,
        contracts=contracts,
        net_worth=net_w,
        reconciliation=rec,
    )
