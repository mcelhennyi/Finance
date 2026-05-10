import {
  SETTINGS_TREE,
  type SettingsNavId,
  type SettingsTreeNode,
} from './navTree'

interface Props {
  activeId: SettingsNavId
  onSelect: (id: SettingsNavId) => void
}

export function SettingsNavTree({ activeId, onSelect }: Props) {
  const renderNode = (node: SettingsTreeNode, depth: number): JSX.Element => {
    if (node.kind === 'leaf') {
      const isActive = activeId === node.id
      return (
        <li key={node.id} className="list-none">
          <button
            type="button"
            onClick={() => onSelect(node.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`w-full text-left rounded-lg py-1.5 pl-2 pr-2 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 ${
              isActive
                ? 'bg-teal-50 text-teal-900 font-medium'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {node.label}
          </button>
        </li>
      )
    }

    return (
      <li key={node.key} className="list-none">
        <div
          className={`text-xs font-semibold uppercase tracking-wider text-slate-400 pt-1 pb-0.5 ${depth === 0 ? '' : 'mt-0.5'}`}
        >
          {node.label}
        </div>
        <ul className="mt-0.5 space-y-0.5 border-l border-slate-200 ml-1.5 pl-3 mb-2">
          {node.children.map(child => renderNode(child, depth + 1))}
        </ul>
      </li>
    )
  }

  return (
    <nav aria-label="Settings sections" className="select-none">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 px-0.5 mb-3">
        Settings
      </p>
      <ul className="space-y-3">{SETTINGS_TREE.map(node => renderNode(node, 0))}</ul>
    </nav>
  )
}
