"""Unified monthly financial summary (Phase 2 dashboard adapter)."""

from datetime import date

from fastapi import APIRouter, Query

from api.schemas import (
    BudgetSummaryRowOut,
    CardCashFlowOut,
    ContractAggregateOut,
    GoalSummaryRowOut,
    LiabilityLineItemOut,
    NetWorthBreakdownOut,
    ReconciliationOut,
    UnifiedViewSummaryOut,
)
from finance.db.session import get_session
from finance.unified import build_unified_monthly_summary
from finance.unified.monthly import UnifiedMonthlySummary

router = APIRouter(tags=["unified-view"])


def _to_response(summary: UnifiedMonthlySummary) -> UnifiedViewSummaryOut:
    c = summary.card_cash_flow
    co = summary.contracts
    nw = summary.net_worth
    r = summary.reconciliation
    return UnifiedViewSummaryOut(
        period_month=summary.period_month,
        as_of=summary.as_of,
        currency=summary.currency,
        budgets=[
            BudgetSummaryRowOut(
                budget_id=b.budget_id,
                category=b.category,
                period_month=b.period_month,
                budget_amount=b.budget_amount,
                actual=b.actual,
                variance=b.variance,
                is_over_budget=b.is_over_budget,
                is_incomplete_month=b.is_incomplete_month,
                trending_over_budget=b.trending_over_budget,
            )
            for b in summary.budgets
        ],
        goals=[
            GoalSummaryRowOut(
                goal_id=g.goal_id,
                name=g.name,
                goal_type=g.goal_type,
                period_month=g.period_month,
                target=g.target,
                actual=g.actual,
                remaining=g.remaining,
                progress_ratio=g.progress_ratio,
                is_complete=g.is_complete,
            )
            for g in summary.goals
        ],
        card_cash_flow=CardCashFlowOut(
            total_charges=c.total_charges,
            total_credits=c.total_credits,
            net_spent=c.net_spent,
            transaction_count=c.transaction_count,
            by_category=c.by_category,
        ),
        contracts=ContractAggregateOut(
            total_income=co.total_income,
            total_liabilities=co.total_liabilities,
            net_cash_after_liabilities=co.net_cash_after_liabilities,
            active_income_count=co.active_income_count,
            active_liability_count=co.active_liability_count,
        ),
        net_worth=NetWorthBreakdownOut(
            assets_total=nw.assets_total,
            assets_tracked=nw.assets_tracked,
            liabilities_total=nw.liabilities_total,
            net_worth=nw.net_worth,
            liability_line_items=[
                LiabilityLineItemOut(
                    id=li.id,
                    name=li.name,
                    liability_type=li.liability_type,
                    principal_amount=li.principal_amount,
                    as_of_date=li.as_of_date,
                    currency=li.currency,
                )
                for li in nw.liability_line_items
            ],
        ),
        reconciliation=ReconciliationOut(
            unified_operating_net=r.unified_operating_net,
            independent_operating_net=r.independent_operating_net,
            discrepancy=r.discrepancy,
            within_tolerance=r.within_tolerance,
            income_aggregate_vs_line_items=r.income_aggregate_vs_line_items,
            within_tolerance_income=r.within_tolerance_income,
        ),
    )


@router.get("/unified-view/summary", response_model=UnifiedViewSummaryOut)
def get_unified_monthly_summary(
    month: date = Query(
        ...,
        description="Any date in the target month; normalized to the first day of that month.",
    ),
    as_of: date | None = Query(
        default=None,
        description="Reference date for incomplete-month / trending flags (defaults to today, capped to month).",
    ),
) -> UnifiedViewSummaryOut:
    with get_session() as session:
        raw = build_unified_monthly_summary(session, month, as_of=as_of)
    return _to_response(raw)
