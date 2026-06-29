/**
 * Deterministic orthogonal routing and lightweight account-node relayout.
 *
 * See Also: tasks/feature-history/FR-0006-budget-cash-flow-graph/tickets.md
 */

export type RoutingPoint = { x: number; y: number }

export type RoutingBox = {
  id: string
  x: number
  y: number
  width: number
  height: number
}

export type RoutedEdgeInput = {
  id: string
  source: string
  target: string
}

export type RoutableNode = {
  id: string
  position: RoutingPoint
}

export type OrthogonalRoute = {
  edgeId: string
  laneIndex: number
  laneOffset: number
  points: RoutingPoint[]
  path: string
  labelPosition: RoutingPoint
  labelBox: RoutingBox
}

export type RoutingOptions = {
  nodeWidth?: number
  nodeHeight?: number
  padding?: number
  laneStep?: number
  exitGap?: number
  labelWidth?: number
  labelHeight?: number
  labelGap?: number
  lineGap?: number
  obstacles?: RoutingBox[]
  nodeBoxes?: Record<string, Partial<Pick<RoutingBox, 'width' | 'height'>>>
}

export type RelayoutOptions = {
  nodeWidth?: number
  nodeHeight?: number
  padding?: number
  rowGap?: number
  obstacles?: RoutingBox[]
  nodeBoxes?: Record<string, Partial<Pick<RoutingBox, 'width' | 'height'>>>
}

const DEFAULT_NODE_WIDTH = 192
const DEFAULT_NODE_HEIGHT = 104
const DEFAULT_PADDING = 18
const DEFAULT_LANE_STEP = 24
const DEFAULT_EXIT_GAP = 48
const DEFAULT_ROW_GAP = 28
const DEFAULT_LABEL_WIDTH = 132
const DEFAULT_LABEL_HEIGHT = 24
const DEFAULT_LABEL_GAP = 14
const DEFAULT_LINE_GAP = 8

function boxForNode(node: RoutableNode, options: RoutingOptions | RelayoutOptions): RoutingBox {
  const override = options.nodeBoxes?.[node.id]
  return {
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    width: override?.width ?? options.nodeWidth ?? DEFAULT_NODE_WIDTH,
    height: override?.height ?? options.nodeHeight ?? DEFAULT_NODE_HEIGHT,
  }
}

function withPadding(box: RoutingBox, padding: number): RoutingBox {
  return {
    id: box.id,
    x: box.x - padding,
    y: box.y - padding,
    width: box.width + padding * 2,
    height: box.height + padding * 2,
  }
}

function boxesOverlap(a: RoutingBox, b: RoutingBox): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
}

/** True when two reserved visual boxes overlap. Exported for deterministic layout tests. */
export function routingBoxesOverlap(a: RoutingBox, b: RoutingBox): boolean {
  return boxesOverlap(a, b)
}

function horizontalCrossesObstacle(y: number, x1: number, x2: number, box: RoutingBox): boolean {
  const left = Math.min(x1, x2)
  const right = Math.max(x1, x2)
  const crossesX = right > box.x && left < box.x + box.width
  const crossesY = y > box.y && y < box.y + box.height
  return crossesX && crossesY
}

function verticalCrossesObstacle(x: number, y1: number, y2: number, box: RoutingBox): boolean {
  const top = Math.min(y1, y2)
  const bottom = Math.max(y1, y2)
  const crossesX = x > box.x && x < box.x + box.width
  const crossesY = bottom > box.y && top < box.y + box.height
  return crossesX && crossesY
}

function segmentHitsObstacle(a: RoutingPoint, b: RoutingPoint, box: RoutingBox): boolean {
  if (a.y === b.y) return horizontalCrossesObstacle(a.y, a.x, b.x, box)
  if (a.x === b.x) return verticalCrossesObstacle(a.x, a.y, b.y, box)
  return false
}

function routeHitsObstacle(points: RoutingPoint[], obstacles: RoutingBox[]): boolean {
  for (let i = 1; i < points.length; i++) {
    if (obstacles.some(box => segmentHitsObstacle(points[i - 1], points[i], box))) return true
  }
  return false
}

function segmentBox(a: RoutingPoint, b: RoutingPoint, id: string, gap: number): RoutingBox {
  const left = Math.min(a.x, b.x)
  const top = Math.min(a.y, b.y)
  return {
    id,
    x: left - gap,
    y: top - gap,
    width: Math.max(Math.abs(a.x - b.x), 1) + gap * 2,
    height: Math.max(Math.abs(a.y - b.y), 1) + gap * 2,
  }
}

function routeSegmentBoxes(points: RoutingPoint[], edgeId: string, gap: number): RoutingBox[] {
  const boxes: RoutingBox[] = []
  for (let i = 1; i < points.length; i++) {
    boxes.push(segmentBox(points[i - 1], points[i], `${edgeId}_segment_${i}`, gap))
  }
  return boxes
}

function dedupePoints(points: RoutingPoint[]): RoutingPoint[] {
  const out: RoutingPoint[] = []
  for (const point of points) {
    const prev = out[out.length - 1]
    if (!prev || prev.x !== point.x || prev.y !== point.y) out.push(point)
  }
  return out
}

function routePath(points: RoutingPoint[]): string {
  const [first, ...rest] = points
  if (!first) return ''
  return `M ${first.x} ${first.y}${rest.map(point => ` L ${point.x} ${point.y}`).join('')}`
}

function labelBox(center: RoutingPoint, edgeId: string, width: number, height: number): RoutingBox {
  return {
    id: `${edgeId}_label`,
    x: center.x - width / 2,
    y: center.y - height / 2,
    width,
    height,
  }
}

function segmentMidpoint(a: RoutingPoint, b: RoutingPoint): RoutingPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

function distanceFromRouteCenter(point: RoutingPoint, center: RoutingPoint): number {
  return Math.abs(point.x - center.x) + Math.abs(point.y - center.y)
}

function labelCandidatesForSegment(
  a: RoutingPoint,
  b: RoutingPoint,
  labelWidth: number,
  labelHeight: number,
  labelGap: number,
): RoutingPoint[] {
  const mid = segmentMidpoint(a, b)
  const horizontalDistances = Array.from(
    { length: 6 },
    (_, index) => labelHeight / 2 + labelGap + index * (labelHeight + labelGap),
  )
  const verticalDistances = Array.from(
    { length: 6 },
    (_, index) => labelWidth / 2 + labelGap + index * (labelWidth / 2 + labelGap),
  )
  if (a.y === b.y) {
    return horizontalDistances.flatMap(distance => [
      { x: mid.x, y: mid.y - distance },
      { x: mid.x, y: mid.y + distance },
      { x: mid.x - labelWidth / 2, y: mid.y - distance },
      { x: mid.x + labelWidth / 2, y: mid.y + distance },
    ])
  }
  if (a.x === b.x) {
    return verticalDistances.flatMap(distance => [
      { x: mid.x + distance, y: mid.y },
      { x: mid.x - distance, y: mid.y },
      { x: mid.x + distance, y: mid.y - labelHeight / 2 },
      { x: mid.x - distance, y: mid.y + labelHeight / 2 },
    ])
  }
  return [mid]
}

function routeLabelCandidates(
  points: RoutingPoint[],
  labelWidth: number,
  labelHeight: number,
  labelGap: number,
): RoutingPoint[] {
  if (points.length < 2) return points
  const center = segmentMidpoint(points[0], points[points.length - 1])
  const segments = points.slice(1).map((point, index) => ({
    a: points[index],
    b: point,
    length: Math.abs(point.x - points[index].x) + Math.abs(point.y - points[index].y),
  }))
  const ordered = segments
    .filter(segment => segment.length > 0)
    .sort((a, b) => b.length - a.length)
  return ordered
    .flatMap(segment => labelCandidatesForSegment(segment.a, segment.b, labelWidth, labelHeight, labelGap))
    .sort((a, b) => distanceFromRouteCenter(a, center) - distanceFromRouteCenter(b, center))
}

function placeRouteLabel(
  edgeId: string,
  points: RoutingPoint[],
  reserved: RoutingBox[],
  options: Required<Pick<RoutingOptions, 'labelWidth' | 'labelHeight' | 'labelGap'>>,
): { position: RoutingPoint; box: RoutingBox } {
  const candidates = routeLabelCandidates(points, options.labelWidth, options.labelHeight, options.labelGap)
  const fallbackPosition = candidates[0] ?? segmentMidpoint(points[0], points[points.length - 1])

  for (const candidate of candidates) {
    const box = labelBox(candidate, edgeId, options.labelWidth, options.labelHeight)
    if (!reserved.some(existing => boxesOverlap(box, existing))) {
      return { position: candidate, box }
    }
  }

  const box = labelBox(fallbackPosition, edgeId, options.labelWidth, options.labelHeight)
  return { position: fallbackPosition, box }
}

function laneCandidates(baseY: number, obstacles: RoutingBox[], laneStep: number): number[] {
  const candidates = [baseY]
  for (const box of obstacles) {
    candidates.push(box.y - laneStep)
    candidates.push(box.y + box.height + laneStep)
  }
  return [...new Set(candidates)].sort((a, b) => Math.abs(a - baseY) - Math.abs(b - baseY) || a - b)
}

function bendCandidates(
  sourceBox: RoutingBox,
  targetBox: RoutingBox,
  obstacles: RoutingBox[],
  exitGap: number,
  laneStep: number,
): number[] {
  const startX = sourceBox.x + sourceBox.width
  const endX = targetBox.x
  const base = startX <= endX
    ? startX + Math.max(exitGap, (endX - startX) / 2)
    : Math.max(startX, endX) + exitGap
  const candidates = [base]
  for (const box of obstacles) {
    candidates.push(box.x - laneStep)
    candidates.push(box.x + box.width + laneStep)
  }
  return [...new Set(candidates)].sort((a, b) => Math.abs(a - base) - Math.abs(b - base) || a - b)
}

function buildRoute(
  sourceBox: RoutingBox,
  targetBox: RoutingBox,
  laneY: number,
  exitGap: number,
  bendX?: number,
): RoutingPoint[] {
  const start = { x: sourceBox.x + sourceBox.width, y: sourceBox.y + sourceBox.height / 2 }
  const end = { x: targetBox.x, y: targetBox.y + targetBox.height / 2 }
  const exitX = Math.max(start.x, end.x) + exitGap

  if (start.x <= end.x) {
    const midX = bendX ?? start.x + Math.max(exitGap, (end.x - start.x) / 2)
    return dedupePoints([
      start,
      { x: start.x, y: laneY },
      { x: midX, y: laneY },
      { x: midX, y: end.y },
      end,
    ])
  }

  return dedupePoints([
    start,
    { x: start.x, y: laneY },
    { x: bendX ?? exitX, y: laneY },
    { x: bendX ?? exitX, y: end.y },
    end,
  ])
}

/** Turn orthogonal points into an SVG path string with square corners. */
export function orthogonalPathFromPoints(points: RoutingPoint[]): string {
  return routePath(dedupePoints(points))
}

/** Return account-node boxes that routing can avoid, plus caller-provided cluster boxes. */
export function obstacleBoxesForNodes(nodes: RoutableNode[], options: RoutingOptions = {}): RoutingBox[] {
  const padding = options.padding ?? DEFAULT_PADDING
  return [
    ...nodes.map(node => withPadding(boxForNode(node, options), padding)),
    ...(options.obstacles ?? []).map(box => withPadding(box, padding)),
  ]
}

/** Route directed graph edges from right-side source handles to left-side target handles. */
export function routeOrthogonalEdges(
  nodes: RoutableNode[],
  edges: RoutedEdgeInput[],
  options: RoutingOptions = {},
): Record<string, OrthogonalRoute> {
  const nodeById = new Map(nodes.map(node => [node.id, boxForNode(node, options)]))
  const laneStep = options.laneStep ?? DEFAULT_LANE_STEP
  const exitGap = options.exitGap ?? DEFAULT_EXIT_GAP
  const labelWidth = options.labelWidth ?? DEFAULT_LABEL_WIDTH
  const labelHeight = options.labelHeight ?? DEFAULT_LABEL_HEIGHT
  const labelGap = options.labelGap ?? DEFAULT_LABEL_GAP
  const lineGap = options.lineGap ?? DEFAULT_LINE_GAP
  const obstacles = obstacleBoxesForNodes(nodes, options)
  const grouped = new Map<string, RoutedEdgeInput[]>()

  for (const edge of edges) {
    const list = grouped.get(edge.source)
    if (list) list.push(edge)
    else grouped.set(edge.source, [edge])
  }

  const routes: Record<string, OrthogonalRoute> = {}
  const reservedLabels: RoutingBox[] = []
  const reservedLines: RoutingBox[] = []
  const routeOrder: { edge: RoutedEdgeInput; index: number; center: number }[] = []
  for (const [, sourceEdges] of [...grouped].sort(([a], [b]) => a.localeCompare(b))) {
    const ordered = [...sourceEdges].sort(
      (a, b) => a.target.localeCompare(b.target) || a.id.localeCompare(b.id),
    )
    const center = (ordered.length - 1) / 2
    ordered.forEach((edge, index) => routeOrder.push({ edge, index, center }))
  }

  for (const { edge, index, center } of routeOrder) {
    const sourceBox = nodeById.get(edge.source)
    const targetBox = nodeById.get(edge.target)
    if (!sourceBox || !targetBox) continue
    const laneOffset = (index - center) * laneStep
    const baseY = sourceBox.y + sourceBox.height / 2 + laneOffset
    const nodeAndClusterAvoid = obstacles.filter(box => box.id !== edge.source && box.id !== edge.target)
    const avoid = [...nodeAndClusterAvoid, ...reservedLabels, ...reservedLines]
    const candidateY = laneCandidates(baseY, avoid, laneStep)
    const candidateX = bendCandidates(sourceBox, targetBox, avoid, exitGap, laneStep)
    const points = candidateY
      .flatMap(y => candidateX.map(x => buildRoute(sourceBox, targetBox, y, exitGap, x)))
      .find(candidate => !routeHitsObstacle(candidate, avoid)) ?? buildRoute(sourceBox, targetBox, baseY, exitGap)

    const lineBoxes = routeSegmentBoxes(points, edge.id, lineGap)
    const label = placeRouteLabel(edge.id, points, [...obstacles, ...reservedLabels, ...reservedLines, ...lineBoxes], {
      labelWidth,
      labelHeight,
      labelGap,
    })

    routes[edge.id] = {
      edgeId: edge.id,
      laneIndex: index,
      laneOffset,
      points,
      path: routePath(points),
      labelPosition: label.position,
      labelBox: label.box,
    }
    reservedLines.push(...lineBoxes)
    reservedLabels.push(label.box)
  }

  return routes
}

/** Preserve node positions unless expanded clusters or account boxes visibly overlap. */
export function relayoutRoutableNodes<T extends RoutableNode>(
  nodes: T[],
  options: RelayoutOptions = {},
): T[] {
  const padding = options.padding ?? DEFAULT_PADDING
  const rowGap = options.rowGap ?? DEFAULT_ROW_GAP
  const placed: RoutingBox[] = [...(options.obstacles ?? [])].map(box => withPadding(box, padding))
  const ordered = [...nodes].sort(
    (a, b) => a.position.y - b.position.y || a.position.x - b.position.x || a.id.localeCompare(b.id),
  )
  const moved = new Map<string, RoutingPoint>()

  for (const node of ordered) {
    let next = { ...node.position }
    let box = withPadding(boxForNode({ ...node, position: next }, options), padding)
    let guard = 0

    while (placed.some(existing => boxesOverlap(box, existing)) && guard < 100) {
      const blockers = placed.filter(existing => boxesOverlap(box, existing))
      const bottom = Math.max(...blockers.map(existing => existing.y + existing.height))
      next = { x: next.x, y: bottom + rowGap }
      box = withPadding(boxForNode({ ...node, position: next }, options), padding)
      guard += 1
    }

    placed.push(box)
    moved.set(node.id, next)
  }

  return nodes.map(node => ({ ...node, position: moved.get(node.id) ?? node.position }))
}
