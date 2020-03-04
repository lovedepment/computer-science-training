import {PageBase} from './pageBase';
import {html} from 'lit-element';

export class PageGraphN extends PageBase {
  constructor() {
    super();
    this.initItems();
    this.connections = new Map();
    this.markEdges = false;
    this.tree = new Map();
    this.renewConfirmed = false;
    this.clickFn = null;
  }
  render() {
    return html`
      <h4>Non-Directed Non-Weighted Graph</h4>
      <div class="controlpanel">
        <x-button .callback=${this.newGraph.bind(this)}>New</x-button>
        <x-button .callback=${this.handleClick.bind(this, this.iteratorDFS)}>DFS</x-button>
        <x-button .callback=${this.handleClick.bind(this, this.iteratorBFS)}>BFS</x-button>
        <x-button .callback=${this.handleClick.bind(this, this.iteratorTree)}>Tree</x-button>
        <x-button .callback=${this.toggleView.bind(this)}>View</x-button>
      </div>
      <x-console class="main-console" defaultMessage="Double-click mouse to make vertex. Drag to make an edge. Drag + Ctrl to move vertex."></x-console>
      <x-console class="console-stats" defaultMessage="—"></x-console>
      <x-items-graph
        .items=${this.items}
        .connections=${this.connections}
        .markEdges=${this.markEdges}
        .tree=${this.tree}
        .clickFn=${this.clickFn}
        limit="18"
        @changed=${this.changedHandler}
      ></x-items-graph>
      <x-items-table
        .items=${this.items}
        .connections=${this.connections}
        hidden
      ></x-items-table>
    `;
  }

  firstUpdated() {
    this.console = this.querySelector('.main-console');
    this.statConsole = this.querySelector('.console-stats');
    this.table = this.querySelector('x-items-table');
    this.graph = this.querySelector('x-items-graph');
  }

  changedHandler() {
    this.table.requestUpdate();
  }

  toggleView() {
    this.table.toggleAttribute('hidden');
    this.graph.toggleAttribute('hidden');
  }

  newGraph() {
    if (this.renewConfirmed) {
      this.initItems();
      this.connections = new Map();
      this.console.setMessage();
      this.renewConfirmed = false;
    } else {
      this.console.setMessage('ARE YOU SURE? Press again to clear old graph');
      this.renewConfirmed = true;
    }
    this.requestUpdate();
  }

  handleClick() {
    super.handleClick(...arguments);
    this.renewConfirmed = false;
  }

  reset() {
    this.items.forEach(item => item.mark = false);
    this.statConsole.setMessage();
    this.markEdges = false;
  }

  * iteratorStartSearch() {
    let startItem;
    this.clickFn = item => {
      startItem = item;
      this.iterate();
    };
    yield 'Single-click on vertex from which to start';
    this.clickFn = null;
    if (startItem == null) {
      return 'ERROR: Item\'s not clicked.';
    }
    yield `You clicked on ${startItem.value}`;
    return startItem;
  }

  //Depth-first search
  * iteratorDFS(isReset = true) {
    const startItem = yield* this.iteratorStartSearch();
    const visits = [startItem];
    const stack = [startItem];
    this.tree = new Map();
    startItem.mark = true;
    this.setStats(visits, stack);
    yield `Start search from vertex ${startItem.value}`;

    while (stack.length > 0) {
      const item = this.getAdjUnvisitedVertex(stack[stack.length - 1]);
      if (item == null) {
        stack.pop();
        this.setStats(visits, stack);
        if (stack.length > 0) {
          yield `Will check vertices adjacent to ${stack[stack.length - 1].value}`;
        } else {
          yield 'No more vertices with unvisited neighbors';
        }
      } else {
        if (stack.length > 0) this.tree.set(stack[stack.length - 1], item);
        stack.push(item);
        visits.push(item);
        item.mark = true;
        this.setStats(visits, stack);
        yield `Visited vertex ${item.value}`;
      }
    }
    if (isReset) {
      yield 'Press again to reset search';
      this.reset();
    }
  }

  getAdjUnvisitedVertex(item) {
    const connectedItems = this.connections.get(item);
    let found = null;
    if (connectedItems.size > 0) {
      found = this.items.find(item => {
        return connectedItems.has(item) && !item.mark;
      });
    }
    return found;
  }

  setStats(visits, stack, queue) {
    if (stack)
      this.statConsole.setMessage(`Visits: ${visits.map(i => i.value).join(' ')}. Stack: (b->t): ${stack.map(i => i.value).join(' ')}`);
    if (queue)
      this.statConsole.setMessage(`Visits: ${visits.map(i => i.value).join(' ')}. Queue: (f->r): ${queue.map(i => i.value).join(' ')}`);
  }

  //Breadth-first search
  * iteratorBFS() {
    const startItem = yield* this.iteratorStartSearch();
    const visits = [startItem];
    const queue = [startItem];
    startItem.mark = true;
    this.setStats(visits, null, queue);
    yield `Start search from vertex ${startItem.value}`;

    let currentItem = queue.shift();
    this.setStats(visits, null, queue);
    yield `Will check vertices adjacent to ${startItem.value}`;

    while (currentItem != null) {
      const item = this.getAdjUnvisitedVertex(currentItem);
      if (item == null) {
        yield `No more unvisited vertices adjacent to ${currentItem.value}`;
        currentItem = queue.shift();
        if (currentItem != null) {
          this.setStats(visits, null, queue);
          yield `Will check vertices adjacent to ${currentItem.value}`;
        }
      } else {
        queue.push(item);
        visits.push(item);
        item.mark = true;
        this.setStats(visits, null, queue);
        yield `Visited vertex ${item.value}`;
      }
    }
    yield 'Press again to reset search';
    this.reset();
  }

  * iteratorTree() {
    this.markEdges = true;
    yield* this.iteratorDFS(false);
    yield 'Press again to hide unmarked edges';

    //TODO:hide

    yield 'Minimum spanning tree; Press again to reset tree';
    this.reset();
  }
}

customElements.define('page-graph-n', PageGraphN);