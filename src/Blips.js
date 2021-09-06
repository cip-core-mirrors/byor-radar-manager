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

        this.lists = {};
        Object.assign(this.lists, this.props.blips);
    }

    handleChange() {
        this.props.onBlipsChange(this.lists);
    }

    async componentDidMount() {
        const response = await fetch(`${this.props.baseUrl}/blips`);
        const data = await response.json();
        this.lists.droppable1 = Object.values(data).flat();
        this.handleChange();
    }

    // a little function to help us with reordering the result
    reorder = (droppableId, startIndex, endIndex) => {
        const list = this.lists[droppableId];
        const [removed] = list.splice(startIndex, 1);
        list.splice(endIndex, 0, removed);
    };

  /**
   * Moves an item from one list to another list.
   */
    move = (droppableSource, droppableDestination) => {
        const source = this.lists[droppableSource.droppableId];
        const destination = this.lists[droppableDestination.droppableId];

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
            this.reorder(
                source.droppableId,
                source.index,
                destination.index,
            );
        } else {
            this.move(
                source,
                destination,
            );
        }
        this.handleChange();
    };

    render() {
        function getListStyle(isDraggingOver) {
            return {
                padding: grid,
                width: 300,
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

        return (
            <div className="blips">
                <DragDropContext onDragEnd={this.onDragEnd}>
                    {Object.entries(this.lists).map(function(entry) {
                        return <Droppable droppableId={entry[0]} key={entry[0]}>
                            {(provided, snapshot) => (
                                <ul
                                    ref={provided.innerRef}
                                    style={getListStyle(snapshot.isDraggingOver)}
                                    className="list-group">
                                    {entry[1].map((item, index) => (
                                        <Draggable
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
                                    ))}
                                    {provided.placeholder}
                                </ul>
                            )}
                        </Droppable>})
                    }
                </DragDropContext>
            </div>
        );
    }
}

export default Blips;