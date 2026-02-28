// UpgradeButton – floats above the main Click Me button.
// Costs UPGRADE_COST clicks; permanently grants +1 bonus click per press.
const UPGRADE_COST = 500;

export default function UpgradeButton({ clicks, purchased, onUpgrade }) {
  const canAfford = clicks >= UPGRADE_COST;

  // Once purchased, render a disabled "owned" badge instead
  if (purchased) {
    return (
      <button className="upgrade-btn upgrade-btn--owned" disabled aria-label="+1 Click upgrade owned">
        +1 Click <span className="upgrade-badge">Owned</span>
      </button>
    );
  }

  return (
    <button
      className={`upgrade-btn${canAfford ? '' : ' upgrade-btn--locked'}`}
      onClick={onUpgrade}
      disabled={!canAfford}
      title={canAfford ? `Buy for ${UPGRADE_COST} clicks` : `Need ${UPGRADE_COST} clicks`}
      aria-label={canAfford ? `Buy +1 Click upgrade for ${UPGRADE_COST} clicks` : 'Not enough clicks for upgrade'}
    >
      +1 Click{' '}
      <span className="upgrade-cost">
        {canAfford ? `(${UPGRADE_COST})` : 'Need 500'}
      </span>
    </button>
  );
}
