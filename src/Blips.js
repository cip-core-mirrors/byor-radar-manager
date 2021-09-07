import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './Blips.css';

const grid = 5;

class Blips extends React.Component {
    constructor(props) {
        super(props);

        this.reorder = this.reorder.bind(this);
        this.move = this.move.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.newSector = this.newSector.bind(this);
        this.newRing = this.newRing.bind(this);
        this.getList = this.getList.bind(this);

        this.lists = Array.from(this.props.blips);
    }

    handleChange() {
        this.props.onBlipsChange(this.lists);
    }

    async componentDidMount() {
        const response = await fetch(`${this.props.baseUrl}/blips`);
        const data = await response.json();
        this.lists[0] = [Object.values(data).flat()];

        const firstSector = [];
        const firstRing = [];
        firstSector.push(firstRing);
        this.lists.push(firstSector);

        this.handleChange();
    }

    getList = (droppableId) => {
        const delimiter = '-';
        const delimiterIndex = droppableId.indexOf(delimiter);
        const sectorIndex = parseInt(droppableId.substring(0, delimiterIndex));
        const ringIndex = parseInt(droppableId.substring(delimiterIndex + 1));

        return this.lists[sectorIndex][ringIndex];
    }

    // a little function to help us with reordering the result
    reorder = (source, destination) => {
        const droppableId = source.droppableId;
        const startIndex = source.index;
        const endIndex = destination.index;

        const list = this.getList(droppableId);
        const [removed] = list.splice(startIndex, 1);
        list.splice(endIndex, 0, removed);
    };

  /**
   * Moves an item from one list to another list.
   */
    move = (droppableSource, droppableDestination) => {
        const source = this.getList(droppableSource.droppableId);
        const destination = this.getList(droppableDestination.droppableId);

        const [removed] = source.splice(droppableSource.index, 1);

        destination.splice(droppableDestination.index, 0, removed);
    };

    onDragEnd(result) {
        const { source, destination } = result;

        // dropped outside the list
        if (!destination) {
            return;
        }

        if (source.droppableId === destination.droppableId) {
            this.reorder(source, destination);
        } else {
            this.move(source, destination);
        }
        this.handleChange();
    };

    newSector(event) {
        const targetId = event.target.id ? event.target.id : event.target.parentElement.id;
        const index = parseInt(targetId.substring('new-sector-'.length));

        const sector = [];
        sector.push([]);
        this.lists.splice(index + 1, 0, sector);

        this.handleChange();
    }

    newRing(event) {
        const targetId = event.target.id ? event.target.id : event.target.parentElement.id;
        const index = parseInt(targetId.substring('new-ring-'.length));
        this.lists[index].push([]);

        this.handleChange();
    }

    render() {
        function getListStyle(isDraggingOver) {
            return {
                padding: grid,
                borderStyle: 'outset',
                borderColor: 'var(--gray)',
                borderWidth: 1,
            }
        }

        function getItemStyle(isDragging, draggableStyle) {
            return {
                // some basic styles to make the items look a bit nicer
                margin: `0 0 ${grid}px 0`,
                //opacity: isDragging ? 0.3 : 1,
                width: '100%',
                listStyleType: 'none',
                color: '-internal-light-dark(black, white)',
                display: 'inline-block',
                textAlign: 'center',
                alignItems: 'flex-start',
                padding: '1px 6px',
                borderWidth: 2,
                borderStyle: 'outset',
                borderColor: 'var(--gray)',
                backgroundColor: 'var(--bg-lvl3)',

                // styles we need to apply on draggables
                ...draggableStyle
            }
        }

        const parent = this;

        return (
            <div className="blips">
                <DragDropContext onDragEnd={this.onDragEnd}>
                    {
                        this.lists.slice(0, 1).map(function(sector, indexSector) {
                            return <div className="list-grid" key={indexSector}>
                                <span className="blips-list-label">All blips</span>
                                {
                                    sector.map(function(ring, indexRing) {
                                        return <Droppable droppableId={`${indexSector}-${indexRing}`} key={indexRing}>
                                            {(provided, snapshot) => (
                                                <ul
                                                    ref={provided.innerRef}
                                                    style={getListStyle(snapshot.isDraggingOver)}
                                                    className="list-group blip-list">
                                                    {ring.map(function(item, index) {
                                                        return <Draggable
                                                            key={item.id_version}
                                                            draggableId={item.id_version}
                                                            index={index}
                                                            className="list-group-item list-group-item-action border-light">
                                                            {(provided, snapshot) => (
                                                                <li
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    style={getItemStyle(
                                                                        snapshot.isDragging,
                                                                        provided.draggableProps.style
                                                                    )}>
                                                                    <span className="text-large font-weight-medium">{item.id.substring(0, item.id.lastIndexOf('-'))}</span><br/>
                                                                    <span className="font-weight-normal">{item.name} </span>
                                                                    <span className="text-light">(v{item.version})</span>
                                                                </li>
                                                            )}
                                                        </Draggable>
                                                    })}
                                                    {provided.placeholder}
                                                </ul>
                                            )}
                                        </Droppable>
                                    })
                                }
                            </div>
                        })
                    }
                    {
                        this.lists.slice(1).map(function(sector, indexSector) {
                            return <div className="list-grid" key={indexSector + 1}>
                                <button
                                    className="btn btn-lg btn-flat-primary new-sector-btn"
                                    id={`new-sector-${indexSector + 1}`}
                                    onClick={parent.newSector}
                                >
                                    <i className="icon icon-md">add</i>
                                    <span className="new-sector-btn-label">New sector</span>
                                </button>
                                {
                                    sector.map(function(ring, indexRing) {
                                        return <Droppable droppableId={`${indexSector + 1}-${indexRing}`} key={indexRing}>
                                            {(provided, snapshot) => (
                                                <ul
                                                    ref={provided.innerRef}
                                                    style={getListStyle(snapshot.isDraggingOver)}
                                                    className="list-group">
                                                    {ring.map(function(item, index) {
                                                            return <Draggable
                                                                key={item.id_version}
                                                                draggableId={item.id_version}
                                                                index={index}
                                                                className="list-group-item list-group-item-action border-light">
                                                                {(provided, snapshot) => (
                                                                    <li
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        style={getItemStyle(
                                                                            snapshot.isDragging,
                                                                            provided.draggableProps.style
                                                                        )}>
                                                                        <span className="text-large font-weight-medium">{item.id.substring(0, item.id.lastIndexOf('-'))}</span><br/>
                                                                        <span className="font-weight-normal">{item.name} </span>
                                                                        <span className="text-light">(v{item.version})</span>
                                                                    </li>
                                                                )}
                                                            </Draggable>
                                                    })}
                                                    {provided.placeholder}
                                                </ul>
                                            )}
                                        </Droppable>
                                    })
                                }
                                <button
                                    className="btn btn-lg btn-flat-primary new-ring-btn"
                                    id={`new-ring-${indexSector + 1}`}
                                    onClick={parent.newRing}
                                >
                                    <i className="icon icon-md">add</i>
                                    <span className="new-ring-btn-label">New ring</span>
                                </button>
                            </div>
                        })
                    }
                </DragDropContext>
            </div>
        );
    }
}

export default Blips;