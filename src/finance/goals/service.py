"""Deterministic goals and budget actuals calculations."""

from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal

from finance.db.models import Budget, Goal, Transaction


@dataclass(frozen=True)
class BudgetActual:
    budget_category: str
    period_month: date
    budget_amount: float
    actual: float
    variance: float
    is_over_budget: bool
    is_incomplete_month: bool
    trending_over_budget: bool


@dataclass(frozen=True)
class GoalProgress:
    goal_name: str
    goal_type: str
    period_month: date
    target: float
    actual: float
    remaining: float
    progress_ratio: float
    is_complete: bool


class GoalsActualsService:
    """Compute budget and goal progress from normalized transaction rows."""

    def compute_budget_actual(
        self,
        budget: Budget,
        transactions: list[Transaction],
        *,
        as_of: date | None = None,
    ) -> BudgetActual:
        month_start, month_end = _month_bounds(budget.period_month)
        month_txns = [
            t
            for t in transactions
            if t.category == budget.category and month_start <= t.transaction_date <= month_end
        ]
        actual = _round2(sum(_effective_amount(t) for t in month_txns))
        budget_amount = _round2(_to_float(budget.amount_limit))
        variance = _round2(actual - budget_amount)
        is_over_budget = variance > 0

        as_of_date = as_of or month_end
        is_incomplete_month = month_start <= as_of_date < month_end
        trending_over_budget = False
        if is_incomplete_month:
            elapsed_days = max((as_of_date - month_start).days + 1, 1)
            total_days = (month_end - month_start).days + 1
            projected = _round2((actual / elapsed_days) * total_days)
            trending_over_budget = projected > budget_amount

        return BudgetActual(
            budget_category=budget.category,
            period_month=budget.period_month,
            budget_amount=budget_amount,
            actual=actual,
            variance=variance,
            is_over_budget=is_over_budget,
            is_incomplete_month=is_incomplete_month,
            trending_over_budget=trending_over_budget,
        )

    def compute_goal_progress(self, goal: Goal, transactions: list[Transaction]) -> GoalProgress:
        month_start, month_end = _month_bounds(goal.period_month)
        month_txns = [t for t in transactions if month_start <= t.transaction_date <= month_end]
        target = _round2(_to_float(goal.target_amount))

        actual = 0.0
        if goal.goal_type.lower() == "savings":
            net = sum(_effective_amount(t) for t in month_txns)
            actual = _round2(max(0.0, -net))

        remaining = _round2(max(target - actual, 0.0))
        progress_ratio = _round2(actual / target) if target > 0 else 0.0
        return GoalProgress(
            goal_name=goal.name,
            goal_type=goal.goal_type,
            period_month=goal.period_month,
            target=target,
            actual=actual,
            remaining=remaining,
            progress_ratio=progress_ratio,
            is_complete=actual >= target,
        )


def _month_bounds(period_month: date) -> tuple[date, date]:
    month_start = period_month.replace(day=1)
    next_month_anchor = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
    return month_start, next_month_anchor - timedelta(days=1)


def _effective_amount(transaction: Transaction) -> float:
    """Normalize charge/credit sign once to avoid refund double counting."""
    amount = _to_float(transaction.amount)
    if amount < 0:
        return amount
    if transaction.is_credit:
        return -amount
    return amount


def _to_float(value: Decimal | float) -> float:
    return float(value)


def _round2(value: float) -> float:
    return round(value, 2)
