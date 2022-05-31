import React from 'react';
import {
    withRouter,
} from "react-router-dom";
import {DragDropContext, Draggable, Droppable} from 'react-beautiful-dnd';
import * as d3 from 'd3';

import Spinner from './Spinner';
import './RadarBlips.css';

const grid = 5;
const svgWidth = 10;
const svgValues = [
    {
        name: 'svg-triangle',
        callback: async function(svg) {
            d3.select(svg)
                .append('polygon')
                .attr('points', trianglePoints.map(point => `${point.x * svgWidth},${point.y * svgWidth}`).join(' '))
        },
    },
    {
        name: 'svg-circle',
        callback: async function(svg) {
            d3.select(svg)
                .append('circle')
                .attr('cx', svgWidth / 2)
                .attr('cy', svgWidth / 2)
                .attr('r', svgWidth / 2);
        },
    },
    {
        name: 'svg-square',
        callback: async function(svg) {
            d3.select(svg)
                .append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", svgWidth)
                .attr("height", svgWidth)
        },
    },
    {
        name: 'svg-diamond',
        callback: async function(svg) {
            d3.select(svg)
                .append('polygon')
                .attr('points', diamondPoints.map(point => `${point.x * svgWidth},${point.y * svgWidth}`).join(' '))
        },
    },
    {
        name: 'svg-wye',
        callback: async function(svg) {
            const symbol = d3.symbol().type(d3.symbolWye).size(svgWidth * svgWidth / 2);
            d3.select(svg)
                .append('path')
                .attr('d', symbol)
                .attr('transform', `translate(${svgWidth / 2}, ${svgWidth / 2})`)
        },
    },
    {
        name: 'svg-star',
        callback: async function(svg) {
            d3.select(svg)
                .append('polygon')
                .attr('points', starPoints.map(point => `${point.x * svgWidth},${point.y * svgWidth}`).join(' '))
        },
    },
    {
        name: 'svg-cross',
        callback: async function(svg) {
            const symbol = d3.symbol().type(d3.symbolCross).size(svgWidth * svgWidth / 2);
            d3.select(svg)
                .append('path')
                .attr('d', symbol)
                .attr('transform', `translate(${svgWidth / 2}, ${svgWidth / 2})`)
        },
    },
];

const starPoints = [
    {x: 0.50, y: 0.00},
    {x: 0.28, y: 0.45},
    {x: 0.19, y: 0.95},
    {x: 0.64, y: 0.71},
    {x: 1.00, y: 0.36},
    {x: 0.50, y: 0.28},
    {x: 0.00, y: 0.36},
    {x: 0.36, y: 0.71},
    {x: 0.81, y: 0.95},
    {x: 0.72, y: 0.45},
];

const trianglePoints = [
    {x: 0.00, y: 1.00},
    {x: 0.50, y: 0.00},
    {x: 1.00, y: 1.00},
];

const diamondPoints = [
    {x: 0.50, y: 0.00},
    {x: 0.90, y: 0.50},
    {x: 0.50, y: 1.00},
    {x: 0.10, y: 0.50},
];

class RadarBlips extends React.Component {
    constructor(props) {
        super(props);

        this.newSector = this.newSector.bind(this);
        this.sectorNameChange = this.sectorNameChange.bind(this);
        this.ringNameChange = this.ringNameChange.bind(this);
        this.newRing = this.newRing.bind(this);
        this.moveRing = this.moveRing.bind(this);
        this.deleteRing = this.deleteRing.bind(this);
        this.moveSector = this.moveSector.bind(this);
        this.deleteSector = this.deleteSector.bind(this);
        this.setBlipValue = this.setBlipValue.bind(this);
        this.setDefaultBlipValue = this.setDefaultBlipValue.bind(this);

        this.state = {
            isFirstRefresh: true,
            isLoading: true,
            lists: [
                [],
            ],
            sectors: [],
            rings: [],
            
            svgRefs: {},

            selectedDefaultRef: 0,
            defaultRef: undefined,
            defaultRefs: {},

            filterSearch: undefined,
        }
    }

    handleChange() {
        this.props.onBlipsChange(this.state.lists);
    }

    async handleParamsChange() {
        this.props.onSectorNameChange(this.state.sectors);
        this.props.onRingNameChange(this.state.rings);
        this.handleChange();
    }

    onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
    }

    async drawSvgs(blip) {
        this.handleParamsChange();

        if (blip) {
            const svgRefs = this.state.svgRefs[blip.id_version];
            const svg = svgRefs[blip.value - 1] || this.state.defaultRefs[this.state.selectedDefaultRef];
            const classList = svg.classList;
            for (const svgObject of svgValues) {
                if (classList.contains(svgObject.name)) {
                    svgObject.callback(svg);
                    this.handleSvgChange(blip);
                    return;
                }
            }
        }

        for (const svgRefs of Object.values(this.state.svgRefs)) {
            for (const svg of Object.values(svgRefs)) {
                if (!svg) continue;
                if (svg.firstChild) continue;

                const classList = svg.classList;
                for (const svgObject of svgValues) {
                    if (classList.contains(svgObject.name)) {
                        svgObject.callback(svg);
                        break;
                    }
                }
            }
        }

        this.handleSvgChange();
    }

    async handleSvgChange(blip) {
        if (blip) {
            const svg = d3.select(blip.ref);
            svg.selectAll("*").remove();
            const svgObject = svgValues[blip.value - 1];
            svgObject.callback(blip.ref);
        } else {
            for (const blip of this.state.lists.slice(1).flat().flat()) {
                const svg = d3.select(blip.ref);
                svg.selectAll("*").remove();
                const svgObject = svgValues[blip.value - 1];
                svgObject.callback(blip.ref);
            }
        }

        this.handleChange();
    }

    async componentDidMount() {
        if (this.state.isFirstRefresh) {
            if (!this.props.isLoggingIn && this.props.isParamsLoaded) {
                this.firstRefresh();
            }
        }
    }

    getList(droppableId) {
        const delimiter = '-';
        const delimiterIndex = droppableId.indexOf(delimiter);
        const sectorIndex = parseInt(droppableId.substring(0, delimiterIndex));
        const ringIndex = parseInt(droppableId.substring(delimiterIndex + 1));

        return this.state.lists[sectorIndex][ringIndex];
    }

    // a little function to help us with reordering the result
    reorder(source, destination) {
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
    move(droppableSource, droppableDestination) {
        const source = this.getList(droppableSource.droppableId);
        const destination = this.getList(droppableDestination.droppableId);

        const [removed] = source.splice(droppableSource.index, 1);

        if (droppableSource.droppableId === '0-0') {
            // Insert blip from blip source list to radar
            let sectorIndex = 1;
            for (const sector of this.state.lists.slice(1)) {
                let ringIndex = 0;
                for (const ring of sector) {
                    for (const blip of ring) {
                        if (blip.id === removed.id) {
                            // Remove existing same blips from radar
                            const foundRing = this.getList(`${sectorIndex}-${ringIndex}`);
                            const [replaced] = foundRing.splice(foundRing.map(b => b.id).indexOf(blip.id), 1);
                            source.splice(droppableSource.index, 0, replaced);
                        }
                    }
                    ringIndex++;
                }
                sectorIndex++;
            }
        }
        
        const inserted = {
            id: removed.id,
            id_version: `${removed.id}-${removed.version}`,
            name: removed.name,
            version: removed.version,
            value: removed.value || this.state.selectedDefaultRef + 1,
        };
        destination.splice(droppableDestination.index, 0, inserted);

        if (droppableDestination.droppableId !== '0-0') {
            const parent = this;
            setTimeout(function() {
                parent.drawSvgs();
            }, 400);
        }
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
        for (let i = 0; i < this.state.rings.length; i++) {
            sector.push([]);
        }
        this.state.lists.push(sector);
        this.state.sectors.push(`Sector ${this.state.sectors.length + 1}`);

        this.handleParamsChange();
    }

    newRing(event) {
        this.state.lists.slice(1).map(list => list.push([]));
        this.state.rings.push(`Ring ${this.state.rings.length + 1}`);

        this.handleParamsChange();
    }

    sectorNameChange(event) {
        const targetId = event.target.id ? event.target.id : event.target.parentElement.id;
        const index = parseInt(targetId.substring('sector-name-'.length));

        this.state.sectors[index] = event.target.value;

        this.handleParamsChange();
    }

    ringNameChange(event) {
        const targetId = event.target.id ? event.target.id : event.target.parentElement.id;
        const index = parseInt(targetId.substring('ring-name-'.length));

        this.state.rings[index] = event.target.value;

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

        const srcRingName = this.state.rings[srcIndex];
        this.state.rings[srcIndex] = this.state.rings[destIndex];
        this.state.rings[destIndex] = srcRingName;

        for (const sector of this.state.lists.slice(1)) {
            const srcRing = sector[srcIndex];
            sector[srcIndex] = sector[destIndex];
            sector[destIndex] = srcRing;
        }

        this.handleParamsChange();
        const parent = this;
        setTimeout(function() {
            parent.drawSvgs();
        }, 200);
    }

    deleteRing(event) {
        const targetId = event.target.id ? event.target.id : event.target.parentElement.id;
        const index = parseInt(targetId.substring('delete-ring-'.length));

        this.state.rings.splice(index, 1);
        const blips = [];
        for (const sector of this.state.lists.slice(1)) {
            const ring = sector.splice(index, 1)[0];
            blips.push(...ring);
        }
        this.state.lists[0][0].push(...blips);

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

        const srcSectorName = this.state.sectors[srcIndex];
        this.state.sectors[srcIndex] = this.state.sectors[destIndex];
        this.state.sectors[destIndex] = srcSectorName;

        const srcSector = this.state.lists[srcIndex + 1];
        this.state.lists[srcIndex + 1] = this.state.lists[destIndex + 1];
        this.state.lists[destIndex + 1] = srcSector;

        this.handleParamsChange();
        const parent = this;
        setTimeout(function() {
            parent.drawSvgs();
        }, 200);
    }

    deleteSector(event) {
        const targetId = event.target.id ? event.target.id : event.target.parentElement.id;
        const index = parseInt(targetId.substring('delete-sector-'.length));

        this.state.sectors.splice(index, 1);
        const sector = this.state.lists.splice(index + 1, 1)[0];
        this.state.lists[0][0].push(...sector.flat());

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
            alignItems: 'center',
            padding: '1px 6px',
            borderWidth: 2,
            borderStyle: 'outset',
            borderColor: 'var(--gray)',
            backgroundColor: 'var(--bg-lvl3)',

            // styles we need to apply on draggables
            ...draggableStyle
        }
    }

    setBlipValue(event) {
        let dataValue = event.target;
        while (!dataValue.getAttribute('data-value')) {
            dataValue = dataValue.parentElement;
        }
        let element = dataValue;
        while (!element.id) {
            element = element.parentElement;
        }

        for (const blip of this.state.lists.slice(1).flat().flat()) {
            if (blip.id_version === element.id) {
                blip.value = parseInt(dataValue.getAttribute('data-value'));
                this.handleSvgChange(blip);
                break;
            }
        }
    }

    setDefaultBlipValue(event) {
        let dataValue = event.target;
        while (!dataValue.getAttribute('data-value')) {
            dataValue = dataValue.parentElement;
        }
        let element = dataValue;
        while (!element.id) {
            element = element.parentElement;
        }

        this.state.selectedDefaultRef = parseInt(dataValue.getAttribute('data-value'));
        const parent = this;
        setTimeout(function() {
            const svg = d3.select(parent.state.defaultRefs);
            svg.selectAll("*").remove();
            svgValues[parent.state.selectedDefaultRef].callback(parent.state.defaultRefs);
        }, 400);
    }

    async firstRefresh() {
        this.state.isFirstRefresh = false;
        this.setState(this.state);

        let blips = [];

        const response1 = await this.props.callApi('GET', `${this.props.baseUrl}/blips`);
        if (response1.ok) {
            blips = await response1.json();
            this.state.lists[0] = [Object.values(blips).flat()];
        } else {
            this.state.lists[0] = [];
        }

        //this.handleChange();

        const radarId = this.props.match.params.radarId;

        const queryString = new URLSearchParams(this.props.location.search);
        const radarVersion = queryString.get('version');
        const fork = queryString.get('fork');
        const forkVersion = queryString.get('forkVersion');

        this.props.onRadarVersionChange(radarId, radarVersion, fork, forkVersion);

        let url = `${this.props.baseUrl}/radar/${radarId}/${radarVersion}/blip-links`;
        if (fork !== undefined && fork !== null) url += `?fork=${fork}`;
        if (forkVersion !== undefined && forkVersion !== null) url += `&forkVersion=${forkVersion}`;

        let blipLinks = [];
        const response2 = await this.props.callApi('GET', url);

        if (response2.ok) {
            blipLinks = await response2.json();
            //const sectors = blipLinks.map(blipLink => blipLink.sector).filter(this.onlyUnique);
            const sectorsOrder = this.props.parameters.filter(param => param.name === 'sectorsOrder')[0].value;
            const sectors = sectorsOrder ? sectorsOrder.split(',') : [];
            for (const sector of sectors) {
                this.state.lists.push([]);
                this.state.sectors.push(sector);
            }
            //const rings = blipLinks.map(blipLink => blipLink.ring).filter(this.onlyUnique);
            const ringsOrder = this.props.parameters.filter(param => param.name === 'ringsOrder')[0].value;
            const rings = ringsOrder ? ringsOrder.split(',') : [];
            for (const ring of rings) {
                this.newRing();
                this.state.rings[this.state.rings.length - 1] = ring;
            }

            //this.handleParamsChange();

            const usingBlips = [];
            for (const blipLink of blipLinks) {
                let sectorIndex = parseInt(this.state.sectors.indexOf(blipLink.sector));
                if (sectorIndex === -1) {
                    this.newSector();
                    this.state.sectors[this.state.sectors.length - 1] = blipLink.sector;
                    sectorIndex = this.state.sectors.length - 1;
                }
                let ringIndex = parseInt(this.state.rings.indexOf(blipLink.ring))
                if (ringIndex === -1) {
                    this.newRing();
                    this.state.rings[this.state.rings.length - 1] = blipLink.ring;
                    ringIndex = this.state.rings.length - 1;
                }
                const sector = this.state.lists.slice(1)[sectorIndex];
                const ring = sector[ringIndex];
                const blipVersion = blipLink.version;
                const blipId = blipLink.id;
                
                const usedBlip = usingBlips.filter(blip => blip.id === blipId && blip.version === blipVersion)[0];
                if (usedBlip) continue;

                const rawBlipVersions = blips[blipId];
                const rawBlip = rawBlipVersions[blipVersion - 1];
                if (!rawBlip) continue;

                const toPush = {
                    id: rawBlip.id,
                    id_version: `${rawBlip.id}-${rawBlip.version}`,
                    name: rawBlip.name,
                    version: rawBlip.version,
                    value: blipLink.value,
                };
                ring.push(toPush);
                usingBlips.push({
                    id: rawBlip.id,
                    version: rawBlip.version,
                });
            }

            for (const usingBlip of usingBlips) {
                const rawBlipVersions = blips[usingBlip.id];
                rawBlipVersions.splice(usingBlip.version - 1, 1);
                if (rawBlipVersions.length === 0) delete blips[usingBlips.id];
            }

            // Remove used blips from list
            this.state.lists[0] = [Object.values(blips).flat()];
        } else {
            this.newSector();
            this.newRing();
        }

        this.state.lists[0].sort(function(a, b) {
            if (a.name < b.name) return -1;
            else if (a.name > b.name) return 1;
            return 0;
        });

        this.state.isLoading = false;
        this.setState(this.state);
        
        svgValues[this.state.selectedDefaultRef].callback(this.state.defaultRefs);
        this.drawSvgs();
    }

    async componentDidUpdate() {
        if (this.state.isFirstRefresh) {
            if (!this.props.isLoggingIn && this.props.isParamsLoaded) {
                this.firstRefresh();
            }
        }
    }

    render() {
        if (this.props.isLoggingIn || this.state.isLoading) return <Spinner/>;

        const parent = this;

        return (
            <div className="blips border-bottom">
                <DragDropContext onDragEnd={result => parent.onDragEnd(result)}>
                    {
                        this.state.lists.slice(0, 1).map(function(sector, indexSector) {
                            return <div className="list-grid list-grid-blips" key={indexSector}>
                                <span className="blips-list-label">All items</span>
                                <input
                                    type="text"
                                    placeholder="Filter"
                                    defaultValue={parent.state.filterSearch}
                                    onChange={function(e) {
                                        e.target.value = e.target.value.trimStart();
                                        const value = e.target.value.toLowerCase();
                                        parent.state.filterSearch = value;
                                        parent.setState(parent.state);
                                    }}
                                />
                                <div className="default-blip">
                                    <span className="default-blip-label">Default :</span>
                                    <div
                                        className="dropdown default-blip-value"
                                    >
                                        <button
                                            className="btn btn-sm btn-outline-secondary dropdownMenuButton"
                                        >
                                            <svg
                                                className={svgValues[parent.state.selectedDefaultRef].name}
                                                ref={function(node) {
                                                    if (node) parent.state.defaultRefs = node
                                                }}
                                            />
                                        </button>
                                        <div className="dropdown-content">
                                            {svgValues.map(function(svgObject, indexSvg) {
                                                return <button
                                                    className="btn btn-lg btn-link dropdown-item"
                                                    data-value={indexSvg + 1}
                                                    onClick={parent.setDefaultBlipValue}
                                                    key={indexSvg}
                                                >
                                                    <svg
                                                        className={svgObject.name}
                                                        ref={function(node) {
                                                            let svgRefs = parent.state.defaultRefs[indexSvg];
                                                            if (!svgRefs) {
                                                                svgRefs = {};
                                                                parent.state.svgRefs[indexSvg] = svgRefs;
                                                            }
                                                            svgRefs[indexSvg] = node;
                                                        }}
                                                    />
                                                </button>
                                            })}
                                        </div>
                                    </div>
                                </div>
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
                                                            key={`${item.id}-${item.version}`}
                                                            draggableId={`${item.id}-${item.version}`}
                                                            index={index}
                                                            className="list-group-item list-group-item-action border-light">
                                                            {function (provided, snapshot) {
                                                                const sheetId = item.id.substring(0, item.id.lastIndexOf('-'));
                                                                const author = sheetId.replace(/-\d+$/, "");

                                                                const style = parent.getItemStyle(
                                                                    snapshot.isDragging,
                                                                    provided.draggableProps.style,
                                                                );
                                                                if (parent.state.filterSearch) {
                                                                    if (!author.toLowerCase().includes(parent.state.filterSearch) && !item.name.toLowerCase().includes(parent.state.filterSearch)) {
                                                                        style.display = 'none';
                                                                    }
                                                                }

                                                                return <li
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    style={style}
                                                                >
                                                                    <span className="font-weight-medium">{item.name}</span>
                                                                    <span
                                                                        className="font-weight-normal"
                                                                        style={{
                                                                            borderWidth: 'thin',
                                                                            borderTopStyle: 'groove',
                                                                        }}
                                                                    >
                                                                        {author}
                                                                    </span>
                                                                    <span className="text-light">Row {item.id.substring(item.id.lastIndexOf('-') + 1)} (v{item.version})</span>
                                                                </li>
                                                            }}
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
                            this.state.rings.map(function(ring, indexRing) {
                                const buttons = [];
                                buttons.push(<button
                                    className="btn btn-lg delete-ring-btn"
                                    id={`delete-ring-${indexRing}`}
                                    onClick={parent.deleteRing}
                                    key={buttons.length}
                                >
                                    <i className="icon icon-md">delete</i>
                                </button>);
                                buttons.push(<button
                                    className="btn btn-lg ring-left-btn"
                                    id={`ring-left-${indexRing}`}
                                    onClick={parent.moveRing}
                                    key={buttons.length}
                                >
                                    <i className="icon icon-md">arrow_back</i>
                                </button>);
                                buttons.push(<button
                                    className="btn btn-lg ring-right-btn"
                                    id={`ring-right-${indexRing}`}
                                    onClick={parent.moveRing}
                                    key={buttons.length}
                                >
                                    <i className="icon icon-md">arrow_forward</i>
                                </button>);
                                buttons.push(<input
                                    className={`ring-name theme-${indexRing}`}
                                    id={`ring-name-${indexRing}`}
                                    value={ring}
                                    onChange={parent.ringNameChange}
                                    key={buttons.length}
                                />);

                                return <div className="ring-name-grid" key={indexRing}>
                                    {buttons}
                                </div>;
                            })
                        }
                    </div>
                    <div className="sectors-list" id="sectors-list">
                        {
                            this.state.lists.slice(1).map(function (sector, indexSector) {
                                const buttons = [];
                                buttons.push(<button
                                    className="btn btn-lg delete-sector-btn"
                                    id={`delete-sector-${indexSector}`}
                                    onClick={parent.deleteSector}
                                    key={buttons.length}
                                >
                                    <i className="icon icon-md">delete</i>
                                </button>);
                                buttons.push(<button
                                    className="btn btn-lg sector-left-btn"
                                    id={`sector-left-${indexSector}`}
                                    onClick={parent.moveSector}
                                    key={buttons.length}
                                >
                                    <i className="icon icon-md">arrow_back</i>
                                </button>);
                                buttons.push(<button
                                    className="btn btn-lg sector-right-btn"
                                    id={`sector-right-${indexSector}`}
                                    onClick={parent.moveSector}
                                    key={buttons.length}
                                >
                                    <i className="icon icon-md">arrow_forward</i>
                                </button>);
                                buttons.push(<input
                                    className="form-control form-control-alt sector-name"
                                    id={`sector-name-${indexSector}`}
                                    value={parent.state.sectors[indexSector]}
                                    onChange={parent.sectorNameChange}
                                    key={buttons.length}
                                />);

                                return <div className="list-grid" key={indexSector + 1}>
                                    <div className="list-buttons">
                                        {buttons}
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
                                                                {function (provided, snapshot) {
                                                                    const sheetId = item.id.substring(0, item.id.lastIndexOf('-'));
                                                                    const author = sheetId.replace(/-\d+$/, "");

                                                                    return <li
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        style={parent.getItemStyle(
                                                                            snapshot.isDragging,
                                                                            provided.draggableProps.style
                                                                        )}
                                                                    >
                                                                        <span className="font-weight-medium blip-name">{item.name}</span>
                                                                        <span
                                                                            className="font-weight-normal blip-sheet"
                                                                            style={{
                                                                                borderWidth: 'thin',
                                                                                borderTopStyle: 'groove',
                                                                            }}
                                                                        >
                                                                            {author}
                                                                        </span>
                                                                        <span className="text-light blip-version">Row {item.id.substring(item.id.lastIndexOf('-') + 1)} (v{item.version})</span>
                                                                        <div
                                                                            className="dropdown blip-value"
                                                                            id={item.id_version}
                                                                        >
                                                                            <button
                                                                                className="btn btn-sm btn-outline-secondary dropdownMenuButton"
                                                                            >
                                                                                <svg
                                                                                    className={svgValues[item.value - 1].name}
                                                                                    ref={node => item.ref = node}
                                                                                />
                                                                            </button>
                                                                            <div className="dropdown-content">
                                                                                {svgValues.map(function(svgObject, indexSvg) {
                                                                                    return <button
                                                                                        className="btn btn-lg btn-link dropdown-item"
                                                                                        data-value={indexSvg + 1}
                                                                                        onClick={parent.setBlipValue}
                                                                                        key={indexSvg}
                                                                                    >
                                                                                        <svg
                                                                                            className={svgObject.name}
                                                                                            ref={function(node) {
                                                                                                let svgRefs = parent.state.svgRefs[item.id_version];
                                                                                                if (!svgRefs) {
                                                                                                    svgRefs = {};
                                                                                                    parent.state.svgRefs[item.id_version] = svgRefs;
                                                                                                }
                                                                                                svgRefs[indexSvg] = node;
                                                                                            }}
                                                                                        />
                                                                                    </button>
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    </li>
                                                                }}
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
                                display: this.state.rings.length < 10 ? 'block' : 'none'
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

export default withRouter(RadarBlips);