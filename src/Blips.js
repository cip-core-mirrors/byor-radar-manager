import React from 'react';
import {DragDropContext, Draggable, Droppable} from 'react-beautiful-dnd';
import './Blips.css';

const grid = 5;

class Blips extends React.Component {
    constructor(props) {
        super(props);

        this.reorder = this.reorder.bind(this);
        this.move = this.move.bind(this);
        this.onDragEnd = this.onDragEnd.bind(this);
        this.getListStyle = this.getListStyle.bind(this);
        this.getItemStyle = this.getItemStyle.bind(this);

        this.newSector = this.newSector.bind(this);
        this.moveSector = this.moveSector.bind(this);
        this.deleteSector = this.deleteSector.bind(this);
        this.sectorNameChange = this.sectorNameChange.bind(this);

        this.newRing = this.newRing.bind(this);
        this.moveRing = this.moveRing.bind(this);
        this.deleteRing = this.deleteRing.bind(this);
        this.ringNameChange = this.ringNameChange.bind(this);

        this.getList = this.getList.bind(this);

        this.lists = Array.from(this.props.blips);
        this.sectors = [];
        this.rings = [];
    }

    handleChange() {
        this.props.onBlipsChange(this.lists);
    }

    handleParamsChange() {
        this.props.onSectorNameChange(this.sectors);
        this.props.onRingNameChange(this.rings);
        this.handleChange();
    }

    onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    async componentDidMount() {
        let blips = [];
        const response1 = await fetch(`${this.props.baseUrl}/blips`);
        if (response1.ok) {
            blips = await response1.json();
            this.lists[0] = [Object.values(blips).flat()];
        } else {
            this.lists[0] = [];
        }

        this.handleChange();

        let blipLinks = [];
        const radarId = window.location.pathname.substring(window.location.pathname.lastIndexOf('/') + 1);
        const response2 = await fetch(`${this.props.baseUrl}/radar/${radarId}/blip-links`);
        if (response2.ok) {
            blipLinks = await response2.json();
            const sectors = blipLinks.map(blipLink => blipLink.sector).filter(this.onlyUnique);
            for (const sector of sectors) {
                this.lists.push([]);
                this.sectors.push(sector);
            }
            const rings = blipLinks.map(blipLink => blipLink.ring).filter(this.onlyUnique);
            for (const ring of rings) {
                this.newRing();
                this.rings[this.rings.length - 1] = ring;
            }

            this.handleParamsChange();

            for (const blipLink of blipLinks) {
                const sectorIndex = this.sectors.indexOf(blipLink.sector)
                const ringIndex = this.rings.indexOf(blipLink.ring)
                const sector = this.lists.slice(1)[sectorIndex];
                const ring = sector[ringIndex];
                const rawBlipVersions = blips[blipLink.blip];
                const rawBlip = rawBlipVersions.splice(blipLink.blip_version - 1, 1)[0];
                const toPush = {
                    id: blipLink.blip,
                    id_version: `${blipLink.blip}-${blipLink.blip_version}`,
                    name: rawBlip.name,
                    version: blipLink.blip_version,
                };
                ring.push(toPush);

                if (rawBlipVersions.length === 0) {
                    delete blips[blipLink.blip];
                }
            }

            // Remove used blips from list
            this.lists[0] = [Object.values(blips).flat()];
        } else {
            this.newSector();
            this.newRing();
        }

        this.handleParamsChange();
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
        const sector = [];
        for (let i = 0; i < this.rings.length; i++) {
            sector.push([]);
        }
        this.lists.push(sector);
        this.sectors.push(`Sector ${this.sectors.length + 1}`);

        this.handleParamsChange();
    }

    newRing(event) {
        this.lists.slice(1).map(list => list.push([]));
        this.rings.push(`Ring ${this.rings.length + 1}`);

        this.handleParamsChange();
    }

    sectorNameChange(event) {
        const targetId = event.target.id ? event.target.id : event.target.parentElement.id;
        const index = parseInt(targetId.substring('sector-name-'.length));

        this.sectors[index] = event.target.value;

        this.handleParamsChange();
    }

    ringNameChange(event) {
        const targetId = event.target.id ? event.target.id : event.target.parentElement.id;
        const index = parseInt(targetId.substring('ring-name-'.length));

        this.rings[index] = event.target.value;

        this.handleParamsChange();
    }

    moveRing(event) {
        const targetId = event.target.id ? event.target.id : event.target.parentElement.id;
        let srcIndex = 0;
        let destIndex = 0;
        if (targetId.indexOf('ring-left') !== -1) {
            srcIndex = parseInt(targetId.substring('ring-left-'.length));
            destIndex = srcIndex - 1;
        } else if (targetId.indexOf('ring-right') !== -1) {
            srcIndex = parseInt(targetId.substring('ring-right-'.length));
            destIndex = srcIndex + 1;
        }

        const srcRingName = this.rings[srcIndex];
        this.rings[srcIndex] = this.rings[destIndex];
        this.rings[destIndex] = srcRingName;

        for (const sector of this.lists.slice(1)) {
            const srcRing = sector[srcIndex];
            sector[srcIndex] = sector[destIndex];
            sector[destIndex] = srcRing;
        }

        this.handleParamsChange();
    }

    deleteRing(event) {
        const targetId = event.target.id ? event.target.id : event.target.parentElement.id;
        const index = parseInt(targetId.substring('delete-ring-'.length));

        this.rings.splice(index, 1);
        const blips = [];
        for (const sector of this.lists.slice(1)) {
            const ring = sector.splice(index, 1)[0];
            blips.push(...ring);
        }
        this.lists[0][0].push(...blips);

        this.handleParamsChange();
    }

    moveSector(event) {
        const targetId = event.target.id ? event.target.id : event.target.parentElement.id;
        let srcIndex = 0;
        let destIndex = 0;
        if (targetId.indexOf('sector-left') !== -1) {
            srcIndex = parseInt(targetId.substring('sector-left-'.length));
            destIndex = srcIndex - 1;
        } else if (targetId.indexOf('sector-right') !== -1) {
            srcIndex = parseInt(targetId.substring('sector-right-'.length));
            destIndex = srcIndex + 1;
        }

        const srcSectorName = this.sectors[srcIndex];
        this.sectors[srcIndex] = this.sectors[destIndex];
        this.sectors[destIndex] = srcSectorName;

        const srcSector = this.lists[srcIndex + 1];
        this.lists[srcIndex + 1] = this.lists[destIndex + 1];
        this.lists[destIndex + 1] = srcSector;

        this.handleParamsChange();
    }

    deleteSector(event) {
        const targetId = event.target.id ? event.target.id : event.target.parentElement.id;
        const index = parseInt(targetId.substring('delete-sector-'.length));

        this.sectors.splice(index, 1);
        const sector = this.lists.splice(index + 1, 1)[0];
        this.lists[0][0].push(...sector.flat());

        this.handleParamsChange();
    }

    getListStyle(isDraggingOver) {
        return {
            padding: grid,
            borderStyle: 'outset',
            borderColor: 'var(--gray)',
            borderWidth: 1,
            //width: isDraggingOver ? 'min-content' : 'auto',
        }
    }

    getItemStyle(isDragging, draggableStyle) {
        return {
            // some basic styles to make the items look a bit nicer
            margin: `0 0 ${grid}px 0`,
            opacity: isDragging ? 0.3 : 1,
            width: '15vw',
            listStyleType: 'none',
            color: '-internal-light-dark(black, white)',
            display: 'grid',
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

    render() {
        const parent = this;

        return (
            <div className="blips border-top">
                <DragDropContext onDragEnd={this.onDragEnd}>
                    {
                        this.lists.slice(0, 1).map(function(sector, indexSector) {
                            return <div className="list-grid list-grid-blips" key={indexSector}>
                                <span className="blips-list-label">All blips</span>
                                {
                                    sector.map(function(ring, indexRing) {
                                        return <Droppable droppableId={`${indexSector}-${indexRing}`} key={indexRing}>
                                            {(provided, snapshot) => (
                                                <ul
                                                    ref={provided.innerRef}
                                                    style={parent.getListStyle(snapshot.isDraggingOver)}
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
                                                                    style={parent.getItemStyle(
                                                                        snapshot.isDragging,
                                                                        provided.draggableProps.style
                                                                    )}
                                                                >
                                                                    <span className="font-weight-medium">{item.name}</span>
                                                                    <span
                                                                        className="font-weight-normal"
                                                                        style={{
                                                                            'border-width': 'thin',
                                                                            'border-top-style': 'groove',
                                                                            //'border-bottom-style': 'groove',
                                                                        }}
                                                                    >
                                                                        {item.id.substring(0, item.id.lastIndexOf('-'))}
                                                                    </span>
                                                                    <span className="text-light">Row {item.id.substring(item.id.lastIndexOf('-') + 1)} (v{item.version})</span>
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
                    <div className="rings-list border-bottom">
                        {
                            this.rings.map(function(ring, indexRing) {
                                return <div className="ring-name-grid">
                                    <button
                                        className="btn btn-lg delete-ring-btn"
                                        id={`delete-ring-${indexRing}`}
                                        onClick={parent.deleteRing}
                                    >
                                        <i className="icon icon-md">delete</i>
                                    </button>
                                    <button
                                        className="btn btn-lg ring-left-btn"
                                        id={`ring-left-${indexRing}`}
                                        onClick={parent.moveRing}
                                    >
                                        <i className="icon icon-md">arrow_back</i>
                                    </button>
                                    <button
                                        className="btn btn-lg ring-right-btn"
                                        id={`ring-right-${indexRing}`}
                                        onClick={parent.moveRing}
                                    >
                                        <i className="icon icon-md">arrow_forward</i>
                                    </button>
                                    <input
                                        className={`ring-name theme-${indexRing}`}
                                        id={`ring-name-${indexRing}`}
                                        value={ring}
                                        onChange={parent.ringNameChange}
                                        key={indexRing}
                                    />
                                </div>
                            })
                        }
                    </div>
                    <div className="sectors-list" id="sectors-list">
                        {
                            this.lists.slice(1).map(function (sector, indexSector) {
                                return <div className="list-grid" key={indexSector + 1}>
                                    <div className="list-buttons">
                                        <button
                                            className="btn btn-lg delete-sector-btn"
                                            id={`delete-sector-${indexSector}`}
                                            onClick={parent.deleteSector}
                                        >
                                            <i className="icon icon-md">delete</i>
                                        </button>
                                        <button
                                            className="btn btn-lg sector-left-btn"
                                            id={`sector-left-${indexSector}`}
                                            onClick={parent.moveSector}
                                        >
                                            <i className="icon icon-md">arrow_back</i>
                                        </button>
                                        <button
                                            className="btn btn-lg sector-right-btn"
                                            id={`sector-right-${indexSector}`}
                                            onClick={parent.moveSector}
                                        >
                                            <i className="icon icon-md">arrow_forward</i>
                                        </button>
                                        <input
                                            className="form-control form-control-alt sector-name"
                                            id={`sector-name-${indexSector}`}
                                            value={parent.sectors[indexSector]}
                                            onChange={parent.sectorNameChange}
                                        />
                                    </div>
                                    {
                                        sector.map(function (ring, indexRing) {
                                            return <Droppable droppableId={`${indexSector + 1}-${indexRing}`}
                                                              key={indexRing}>
                                                {(provided, snapshot) => (
                                                    <ul
                                                        ref={provided.innerRef}
                                                        style={parent.getListStyle(snapshot.isDraggingOver)}
                                                        className={`list-group theme-${indexRing}`}>
                                                        {ring.map(function (item, index) {
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
                                                                        style={parent.getItemStyle(
                                                                            snapshot.isDragging,
                                                                            provided.draggableProps.style
                                                                        )}
                                                                    >
                                                                        <span className="font-weight-medium">{item.name}</span>
                                                                        <span
                                                                            className="font-weight-normal"
                                                                            style={{
                                                                                'border-width': 'thin',
                                                                                'border-top-style': 'groove',
                                                                                //'border-bottom-style': 'groove',
                                                                            }}
                                                                        >
                                                                            {item.id.substring(0, item.id.lastIndexOf('-'))}
                                                                        </span>
                                                                        <span className="text-light">Row {item.id.substring(item.id.lastIndexOf('-') + 1)} (v{item.version})</span>
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
                    </div>
                    <div className="new-buttons-grid border-bottom">
                        <button
                            className="btn btn-lg btn-flat-primary new-sector-btn"
                            id="new-sector-btn"
                            onClick={parent.newSector}
                        >
                            <i className="icon icon-md">add</i>
                            <span className="new-sector-btn-label">New sector</span>
                        </button>
                        <button
                            className="btn btn-lg btn-flat-primary new-ring-btn"
                            id="new-ring-btn"
                            style={{
                                display: this.rings.length < 5 ? 'block' : 'none'
                            }}
                            onClick={parent.newRing}
                        >
                            <i className="icon icon-md">add</i>
                            <span className="new-ring-btn-label">New ring</span>
                        </button>
                    </div>
                </DragDropContext>
            </div>
        );
    }
}

export default Blips;