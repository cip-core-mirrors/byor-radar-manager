import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import './Blips.css';

const id2List = {
    droppable1: 'list1',
    droppable2: 'list2',
};

const grid = 5;

class Blips extends React.Component {
    constructor(props) {
        super(props);

        this.reorder = this.reorder.bind(this);
        this.move = this.move.bind(this);
        this.getListStyle = this.getListStyle.bind(this);
        this.getItemStyle = this.getItemStyle.bind(this);
        this.getList = this.getList.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
    }

    handleChange(blips) {
        this.props.onBlipsChange(blips)
    }

    async componentDidMount() {
        const response = await fetch(`${this.props.baseUrl}/blips`);
        const data = await response.json();
        this.handleChange({
            list1: Object.values(data).flat(),
            list2: [],
        });
    }

    // a little function to help us with reordering the result
    reorder = (list, startIndex, endIndex) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
    
        return result;
    };
  
  /**
   * Moves an item from one list to another list.
   */
    move = (source, destination, droppableSource, droppableDestination) => {
        const sourceClone = Array.from(source);
        const destClone = Array.from(destination);
        const [removed] = sourceClone.splice(droppableSource.index, 1);
    
        destClone.splice(droppableDestination.index, 0, removed);
    
        const result = {};
        result[droppableSource.droppableId] = sourceClone;
        result[droppableDestination.droppableId] = destClone;
    
        return result;
    };
    
    getListStyle = isDraggingOver => ({
        padding: grid,
        width: 300,
        borderStyle: 'outset',
        borderColor: 'var(--gray)',
        borderWidth: 1,
    });
  
    getItemStyle = (isDragging, draggableStyle) => ({
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
    });

    getList(id) {
        return this.props.blips[id2List[id]];
    }

    onDragEnd(result) {
        const { source, destination } = result;

        // dropped outside the list
        if (!destination) {
            return;
        }

        if (source.droppableId === destination.droppableId) {
            const list = this.reorder(
                this.getList(source.droppableId),
                source.index,
                destination.index,
            );

            if (source.droppableId === 'droppable2') {
                this.handleChange({
                    list1: this.getList('droppable1'),
                    list2: list,
                });
            } else {
                this.handleChange({
                    list1: list,
                    list2: this.getList('droppable2'),
                });
            }
        } else {
            const result = this.move(
                this.getList(source.droppableId),
                this.getList(destination.droppableId),
                source,
                destination,
            );

            this.handleChange({
                list1: result.droppable1,
                list2: result.droppable2,
            });
        }
    };

    render() {
        return (
            <div className="blips">
            <DragDropContext onDragEnd={this.onDragEnd}>
                <Droppable droppableId="droppable1">
                    {(provided, snapshot) => (
                        <ul
                            ref={provided.innerRef}
                            style={this.getListStyle(snapshot.isDraggingOver)}
                            className="list-group">
                            {this.props.blips.list1.map((item, index) => (
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
                                            style={this.getItemStyle(
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
                </Droppable>
                <Droppable droppableId="droppable2">
                    {(provided, snapshot) => (
                        <ul
                            ref={provided.innerRef}
                            style={this.getListStyle(snapshot.isDraggingOver)}
                            className="list-group">
                            {this.props.blips.list2.map((item, index) => (
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
                                            style={this.getItemStyle(
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
                </Droppable>
            </DragDropContext>
            </div>
        );
    }
}

export default Blips;