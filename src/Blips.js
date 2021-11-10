import React from 'react';

import Spinner from './Spinner';
import ButtonLegend from './ButtonLegend';
import './Blips.css';

function normalizeColumnName(name) {
    const words = name.split(' ');
    return words[0].toLowerCase() + words.slice(1).map(n => n[0].toUpperCase() + n.slice(1))
}

function parseDate(value) {
    const date = value ? new Date(value) : undefined;
    if (date && typeof date.getMonth === 'function' && !Number.isNaN(date.getMonth())) {
        return date;
    }
}

const addColumnId = 'add-column-blip'

class Blips extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            isLoadingMyBlips: false,
            isLoadingAllBlips: false,
            isFirstRefresh: true,
            submitting: false,
            success1: undefined,
            returnMessage1: undefined,
            success2: undefined,
            returnMessage2: undefined,
            success3: undefined,
            returnMessage3: undefined,
            myBlips: [],
            selectedBlip: undefined,
            createBlip: {},
            blipIds: [],
            allBlips: [],
            allBlipsColumns: [],
            allBlipsRows: [],
            changedAllBlipsRows: {},
            blipRowStyles: {},
            filterSearch: '',
        };
    }

    async componentDidMount() {
        this.state.isLoading = false;
        this.setState(this.state);
    }

    async refreshMyBlips() {
        this.state.isLoadingMyBlips = true;
        this.setState(this.state);

        const response = await this.props.callApi('GET', `${this.props.baseUrl}/blip`)
        if (!response.ok) {
            return;
        }

        const data = await response.json();
        for (const blipId in data) {
            const blipVersions = data[blipId];
            this.state.myBlips[blipId] = blipVersions[blipVersions.length - 1];
        }

        this.state.isLoadingMyBlips = false;
        this.setState(this.state);
    }

    async refreshAllBlips() {
        this.state.isLoadingAllBlips = true;
        this.setState(this.state);

        const allBlipsResponse = await this.props.callApi('GET', `${this.props.baseUrl}/blips`);
        if (allBlipsResponse.ok) {
            let allBlips = await allBlipsResponse.json();
            allBlips = Object.values(allBlips);
            allBlips.sort(function(a, b) {
                const nameA = a[a.length - 1].name.trim().toLowerCase();
                const nameB = b[b.length - 1].name.trim().toLowerCase();
                if (nameA < nameB) return -1;
                else if (nameA > nameB) return 1;
                return 0;
            });
            const columnsIndex = {};
            for (const blipVersions of allBlips) {
                const blipVersion = blipVersions[blipVersions.length - 1];
                const { id, id_version, lastupdate, name, version, permissions } = blipVersion;
                delete blipVersion.id;
                delete blipVersion.id_version;
                delete blipVersion.lastupdate;
                delete blipVersion.name;
                delete blipVersion.version;
                delete blipVersion.permissions;
                for (const columnName of Object.keys(blipVersion)) {
                    const columnIndex = columnsIndex[columnName];
                    if (columnIndex === undefined) {
                        columnsIndex[columnName] = Object.keys(columnsIndex).length;
                    }
                }
                blipVersion.id = id;
                blipVersion.id_version = id_version;
                blipVersion.lastupdate = lastupdate;
                blipVersion.name = name;
                blipVersion.version = version;
                blipVersion.permissions = permissions;
            }

            this.state.allBlips = allBlips;
            this.state.allBlipsRows = [];
            this.state.allBlipsColumns = [];

            this.addAllBlipColumn('Author');
            this.addAllBlipColumn('Name');
            this.addAllBlipColumn('Last update');
            for (const columnName of Object.keys(columnsIndex)) {
                this.addAllBlipColumn(columnName);
            }
            for (const blipVersions of allBlips) {
                // list all blips
                const blipVersion = blipVersions[blipVersions.length - 1];
                const row = [];

                if (blipVersion.permissions) {
                    const ownerPermission = blipVersion.permissions.filter(permission => permission.rights.indexOf('owner') !== -1)[0];
                    row.push(ownerPermission ? ownerPermission.userId : '');
                } else {
                    row.push('');
                }

                row.push(blipVersion.name);

                const lastUpdateDate = parseDate(blipVersion.lastupdate);
                if (lastUpdateDate) {
                    row.push(`${lastUpdateDate.getFullYear()}-${lastUpdateDate.getMonth() + 1}-${lastUpdateDate.getDate()}`);
                } else {
                    row.push('');
                }

                const rowInitialLength = row.length;

                for (const entry of Object.entries(columnsIndex)) {
                    const columnName = entry[0];
                    const columnIndex = entry[1];
                    const columnValue = blipVersion[columnName];
                    while (row.length - rowInitialLength < columnIndex) {
                        row.push('');
                    }
                    row[columnIndex + rowInitialLength] = columnValue !== undefined ? columnValue : '';
                }
                this.addAllBlip(row);
            }

            this.state.isLoadingAllBlips = false;
            this.setState(this.state);
        }
    }

    addAllBlipColumn(columnName) {
        this.state.allBlipsColumns.push(columnName || '');
        for (const row of this.state.allBlipsRows) {
            row.push('');
        }
    }

    addAllBlip(row = []) {
        while (row.length < this.state.allBlipsColumns.length) {
            row.push('');
        }
        this.state.allBlipsRows.push(row);
    }

    addBlip() {
        const row = [];
        while (row.length < this.state.columns.length) {
            row.push('');
        }
        this.state.rows.push(row);
    }

    addColumn(columnName) {
        this.state.columns.push(columnName || '');
        for (const row of this.state.rows) {
            row.push('');
        }
    }

    async deleteBlip(rowIndex) {
        const blipId = this.state.blipIds[rowIndex];
        if (blipId) {
            const response = await this.props.callApi('DELETE', `${this.props.baseUrl}/blips/${blipId}`);
            if (response.ok) {
                this.state.rows.splice(rowIndex, 1);
                this.state.blipIds.splice(rowIndex, 1);
            } else {
                this.state.returnMessage1 = "Error deleting blip";
            }
        }
    }

    async handleCreate(blip) {
        if (this.state.submitting) return;
        
        this.state.submitting = true;
        this.setState(this.state);

        const response = await this.props.callApi('POST', `${this.props.baseUrl}/blips`, {
            blips: [ blip ],
        });
        this.state.success3 = response.ok;
        const data = await response.json();
        const parent = this;
        if (response.ok) {
            //this.state.createBlip = {};
            this.state.returnMessage3 = "Successfully created blip";
            this.refreshMyBlips();
            this.refreshAllBlips();
            setTimeout(function() {
                parent.state.success3 = undefined;
                parent.state.submitting = false;
                parent.state.returnMessage3 = undefined;
                parent.setState(parent.state);
            }, 5000);
        } else {
            this.state.returnMessage3 = data.routine;
            setTimeout(function() {
                parent.state.submitting = false;
                parent.setState(parent.state);
            }, 2000);
        }

        this.setState(this.state);
    }

    async handleDelete(blip) {
        if (this.state.submitting) return;

        this.state.submitting = true;
        this.setState(this.state);

        const response = await this.props.callApi('DELETE', `${this.props.baseUrl}/blips/${blip.id}`);
        this.state.success4 = response.ok;
        const data = await response.json();
        const parent = this;
        if (response.ok) {
            this.state.returnMessage4 = `Successfully deleted blip`;
            this.state.selectedBlip = undefined;
            this.refreshMyBlips();
            this.refreshAllBlips();
            setTimeout(function() {
                parent.state.success4 = undefined;
                parent.state.submitting = false;
                parent.state.returnMessage4 = undefined;
                parent.setState(parent.state);
            }, 5000);
        } else {
            this.state.returnMessage4 = data.routine;
            setTimeout(function() {
                parent.state.submitting = false;
                parent.setState(parent.state);
            }, 2000);
        }

        this.setState(this.state);
    }

    async handleSubmit(blip) {
        if (this.state.submitting) return;

        this.state.submitting = true;
        this.setState(this.state);

        const response = await this.props.callApi('PUT', `${this.props.baseUrl}/blips/${blip.id}`, {
            blip,
        });
        this.state.success1 = response.ok;
        const data = await response.json();
        const parent = this;
        if (response.ok) {
            this.state.returnMessage1 = `Successfully edited blip`;
            this.refreshMyBlips();
            this.refreshAllBlips();
            setTimeout(function() {
                parent.state.success1 = undefined;
                parent.state.submitting = false;
                parent.state.returnMessage1 = undefined;
                parent.setState(parent.state);
            }, 5000);
        } else {
            this.state.returnMessage1 = data.routine;
            setTimeout(function() {
                parent.state.submitting = false;
                parent.setState(parent.state);
            }, 2000);
        }

        this.setState(this.state);
    }

    async handleChangeAuthors() {
        if (this.state.submitting) return;

        const allBlipsKey = this.state.allBlips.map(blipVersions => blipVersions[blipVersions.length - 1].id);
        const blipsRights = [];
        for (const entry of Object.entries(this.state.changedAllBlipsRows)) {
            const index = entry[0];
            const newAuthor = entry[1];
            const blipRights = {};
            blipRights.blip = allBlipsKey[index];
            blipRights.userId = newAuthor;
            blipRights.rights = ['owner', 'edit'];
            blipsRights.push(blipRights);
        }

        if (blipsRights.length === 0) return;

        this.state.submitting = true;
        this.setState(this.state);

        const response = await this.props.callApi('PUT', `${this.props.baseUrl}/admin/blips/permissions`, blipsRights);
        this.state.success2 = response.ok;

        const parent = this;
        if (response.ok) {
            this.state.returnMessage2 = "Successfully changed authors";
            setTimeout(function() {
                parent.state.success2 = undefined;
                parent.state.submitting = false;
                parent.state.returnMessage2 = undefined;
                parent.setState(parent.state);
            }, 5000);
            this.refreshMyBlips();
            this.refreshAllBlips();
        } else {
            const data = await response.json();
            this.state.returnMessage2 = data.routine;
            setTimeout(function() {
                parent.state.submitting = false;
                parent.setState(parent.state);
            }, 2000);
        }
    }

    async firstRefresh() {
        this.state.isFirstRefresh = false;
        this.setState(this.state);

        this.refreshMyBlips();
        this.refreshAllBlips();
    }

    async componentDidUpdate() {
        if (this.state.isFirstRefresh) {
            if (!this.props.isLoggingIn && !this.state.isLoading) {
                this.firstRefresh();
            }
        }
    }

    render() {
        if (this.props.isLoggingIn || this.state.isLoading) return <Spinner/>;

        const parent = this;

        if (this.props.authenticated) {
            const metaParamsKeys = [ 'id', 'id_version', 'lastupdate', 'name', 'version' ];

            const blipParams = [];
            if (this.state.selectedBlip) {
                const metaParams = {};
                for (const metaParamsKey of metaParamsKeys) {
                    metaParams[metaParamsKey] = this.state.selectedBlip[metaParamsKey];
                    delete this.state.selectedBlip[metaParamsKey];
                }
                for (const entry of Object.entries(this.state.selectedBlip)) {
                    const param = {};
                    param.name = entry[0];
                    param.value = entry[1];
                    blipParams.push(param);
                }
                for (const entry of Object.entries(metaParams)) {
                    this.state.selectedBlip[entry[0]] = entry[1];
                }
            }

            const createBlipParams = [];
            const createMetaParams = {};
            for (const metaParamsKey of metaParamsKeys) {
                createMetaParams[metaParamsKey] = this.state.createBlip[metaParamsKey];
                delete this.state.createBlip[metaParamsKey];
            }
            for (const entry of Object.entries(this.state.createBlip)) {
                const param = {};
                param.name = entry[0];
                param.value = entry[1];
                createBlipParams.push(param);
            }
            for (const entry of Object.entries(createMetaParams)) {
                this.state.createBlip[entry[0]] = entry[1];
            }

            return <div className="new-blips-grid">
                <h3>New blip</h3>
                <div className="new-blip-grid">
                    <div className="blip-edit-grid">
                        <div className="blip-edit-meta" key={this.state.createBlip.name || ""}>
                            <div className="form-group">
                                <label className="paramName">Name &nbsp;</label>
                                <input
                                    type="text"
                                    className="form-control form-control-alt"
                                    defaultValue={this.state.createBlip.name || ""}
                                    onChange={function(e) {
                                        parent.state.createBlip.name = e.target.value;
                                    }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="paramName">Last update &nbsp;</label>
                                <input
                                    type="text"
                                    className="form-control form-control-alt"
                                    placeholder="YYYY-MM-DD"
                                    defaultValue={this.state.createBlip.lastupdate || ""}
                                    onChange={function(e) {
                                        parent.state.createBlip.lastupdate = e.target.value;
                                    }}
                                />
                            </div>
                        </div>
                        {
                            createBlipParams.map(param => 
                                <div className="form-group" key={param.name}>
                                    <label className="paramName">{param.name} &nbsp;</label>
                                    <span className="help-tooltip">
                                        <i
                                            className="icon icon-md"
                                            style={{
                                                cursor: 'pointer',
                                            }}
                                            onClick={function(e) {
                                                delete parent.state.createBlip[param.name];
                                                parent.setState(parent.state);
                                            }}
                                        >
                                            delete
                                        </i>
                                    </span>
                                    <textarea
                                        type="text"
                                        className="form-control form-control-alt"
                                        defaultValue={param.value || ""}
                                        style={{
                                            display: 'none',
                                            minWidth: '175px',
                                            resize: 'vertical',
                                            maxHeight: '10em',
                                        }}
                                        onChange={function(e) {
                                            parent.state.createBlip[param.name] = e.target.value;
                                        }}
                                    />
                                </div>
                            )
                        }
                        <div className="add-column-grid">
                            <input
                                type="text"
                                className="form-control form-control-alt"
                                placeholder="Column name"
                                id={`${addColumnId}-create`}
                            />
                            <input
                                readOnly
                                value="Add column"
                                className="submit-btn btn btn-lg btn-primary"
                                onClick={async function(e) {
                                    const input = document.getElementById(`${addColumnId}-create`);
                                    const columnName = input.value;
                                    if (!columnName) return;
                                    input.value = "";
                                    parent.state.createBlip[columnName] = "";
                                    parent.setState(parent.state);
                                }}
                            />
                        </div>
                    </div>
                    <label
                        className={this.state.success3 ? "text-success" : "text-danger"}
                        style={{
                            display: this.state.returnMessage3 ? 'inline-block' : 'none',
                            marginBottom: 0,
                        }}
                    >
                        {this.state.returnMessage3}
                    </label>
                    <input
                        //type="submit"
                        readOnly
                        value="Create blip"
                        style={{
                            width: '100%',
                        }}
                        className={`submit-btn btn btn-lg ${this.state.success3 === undefined ? 'btn-primary' : (this.state.success3 ? 'btn-success' : 'btn-danger')}`}
                        onClick={async function(e) {
                            await parent.handleCreate(parent.state.createBlip);
                        }}
                    />
                    <ButtonLegend/>
                </div>
                <h3>My blips</h3>
                <div className="my-blips-grid">
                    {
                        this.state.isLoadingMyBlips ? <Spinner/> :
                        <select
                            className="custom-select select-blip-list"
                            onClick={function(e) {
                                const blipId = e.target.value;
                                if (!blipId) return;
                                if (parent.state.selectedBlip && blipId === parent.state.selectedBlip.id) return;

                                parent.state.selectedBlip = Object.assign({}, parent.state.myBlips[blipId]);
                                parent.setState(parent.state);
                            }}
                        >
                            <option selected disabled value="">Select a blip to edit</option>
                            {
                                Object.values(this.state.myBlips).map(blip =>
                                    <option
                                        value={blip.id}
                                        key={blip.id}
                                    >
                                        {blip.name}
                                    </option>
                                )
                            }
                        </select>
                    }
                    {
                        !this.state.selectedBlip ? null :
                        <div className="blip-edit-grid">
                            <div className="blip-edit-meta">
                                <div className="form-group" key={`${this.state.selectedBlip.id}-name`}>
                                    <label className="paramName">Name &nbsp;</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-alt"
                                        defaultValue={this.state.selectedBlip.name || ""}
                                        onChange={function(e) {
                                            parent.state.selectedBlip.name = e.target.value;
                                        }}
                                    />
                                </div>
                                <div className="form-group" key={`${this.state.selectedBlip.id}-lastupdate`}>
                                    <label className="paramName">Last update &nbsp;</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-alt"
                                        defaultValue={this.state.selectedBlip.lastupdate || ""}
                                        onChange={function(e) {
                                            parent.state.selectedBlip.lastupdate = e.target.value;
                                        }}
                                    />
                                </div>
                            </div>
                            {
                                blipParams.map(param => 
                                    <div className="form-group" key={`${this.state.selectedBlip.id}-${param.name}`}>
                                        <label className="paramName">{param.name} &nbsp;</label>
                                        <span className="help-tooltip">
                                            <i
                                                className="icon icon-md"
                                                style={{
                                                    cursor: 'pointer',
                                                }}
                                                onClick={function(e) {
                                                    delete parent.state.selectedBlip[param.name];
                                                    parent.setState(parent.state);
                                                }}
                                            >
                                                delete
                                            </i>
                                        </span>
                                        <textarea
                                            type="text"
                                            className="form-control form-control-alt"
                                            defaultValue={param.value || ""}
                                            style={{
                                                minWidth: '175px',
                                                resize: 'vertical',
                                                maxHeight: '10em',
                                            }}
                                            onChange={function(e) {
                                                parent.state.selectedBlip[param.name] = e.target.value;
                                            }}
                                        />
                                    </div>
                                )
                            }
                            <div className="add-column-grid">
                                <input
                                    type="text"
                                    className="form-control form-control-alt"
                                    placeholder="Column name"
                                    id={addColumnId}
                                />
                                <input
                                    readOnly
                                    value="Add column"
                                    className="submit-btn btn btn-lg btn-primary"
                                    onClick={async function(e) {
                                        const input = document.getElementById(addColumnId);
                                        const columnName = input.value;
                                        if (!columnName) return;
                                        input.value = "";
                                        parent.state.selectedBlip[columnName] = "";
                                        parent.setState(parent.state);
                                    }}
                                />
                            </div>
                        </div>
                    }
                    <label
                        className={this.state.success1 ? "text-success" : "text-danger"}
                        style={{
                            display: this.state.returnMessage1 ? 'inline-block' : 'none',
                            marginBottom: 0,
                        }}
                    >
                        {this.state.returnMessage1}
                    </label>
                    <label
                        className={this.state.success4 ? "text-success" : "text-danger"}
                        style={{
                            display: this.state.returnMessage4 ? 'inline-block' : 'none',
                            marginBottom: 0,
                        }}
                    >
                        {this.state.returnMessage4}
                    </label>
                    {
                        !this.state.selectedBlip ? null :
                        <div className="blip-buttons-legend-grid">
                            <div className="blip-buttons-grid">
                                <input
                                    //type="submit"
                                    readOnly
                                    value="Delete blip"
                                    style={{
                                        width: '100%',
                                    }}
                                    className={`submit-btn btn btn-lg ${this.state.success4 === undefined ? 'btn-primary' : (this.state.success4 ? 'btn-success' : 'btn-danger')}`}
                                    onClick={async function(e) {
                                        await parent.handleDelete(parent.state.selectedBlip);
                                    }}
                                />
                                <input
                                    //type="submit"
                                    readOnly
                                    value="Save blip"
                                    style={{
                                        width: '100%',
                                    }}
                                    className={`submit-btn btn btn-lg ${this.state.success1 === undefined ? 'btn-primary' : (this.state.success1 ? 'btn-success' : 'btn-danger')}`}
                                    onClick={async function(e) {
                                        await parent.handleSubmit(parent.state.selectedBlip);
                                    }}
                                />
                            </div>
                            <ButtonLegend/>
                        </div>
                    }
                </div>
                <h3>All blips</h3>
                {
                    this.state.isLoadingAllBlips ? <Spinner/> :
                    <div className="all-blips-grid">
                        <input
                            type="text"
                            placeholder="Search"
                            defaultValue={this.state.filterSearch}
                            onChange={function(e) {
                                e.target.value = e.target.value.trim();
                                const value = e.target.value.toLowerCase();
                                parent.state.filterSearch = value;
                                let rowIndex = 0;
                                for (const row of parent.state.allBlipsRows) {
                                    if (value) {
                                        const name = row[1].trim().toLowerCase();
                                        if (name.includes(value)) {
                                            parent.state.blipRowStyles[rowIndex] = '';
                                        } else {
                                            parent.state.blipRowStyles[rowIndex] = 'none';
                                        }
                                    } else {
                                        parent.state.blipRowStyles[rowIndex] = '';
                                    }
                                    rowIndex++;
                                }
                                parent.setState(parent.state);
                            }}
                        />
                        <table
                            className="all-blips-table"
                        >
                            <thead>
                                <tr>
                                    {
                                        this.state.allBlipsColumns.map((columnName, index) =>
                                            <th
                                                key={index}
                                                scope="col"
                                                className={index === 1 ? "fit-width" : "new-blips-table-column"}
                                                style={{
                                                    paddingRight: index === 1 ? '1.5em': undefined,
                                                }}
                                            >
                                                {columnName}
                                            </th>
                                        )
                                    }
                                </tr>
                            </thead>
                            <tbody id="blips-table">
                                {
                                    this.state.allBlipsRows.map((row, rowIndex) =>
                                        <tr
                                            key={rowIndex}
                                            style={{
                                                display: this.state.blipRowStyles[rowIndex] || '',
                                            }}
                                        >
                                            {
                                                row.map((columnValue, index) => 
                                                    <td
                                                        key={index}
                                                        className="table-cell"
                                                    >
                                                        <div
                                                            className="view-table-cell"
                                                        >
                                                            {
                                                                this.props.permissions.adminUser && index === 0 ?
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-alt"
                                                                    defaultValue={columnValue}
                                                                    onChange={function(e) {
                                                                        const value = e.target.value;
                                                                        parent.state.changedAllBlipsRows[rowIndex] = value;
                                                                        row[0] = value;
                                                                    }}
                                                                />
                                                                : columnValue
                                                            }
                                                        </div>
                                                    </td>
                                                )
                                            }
                                        </tr>
                                    )
                                }
                            </tbody>
                        </table>
                        <label
                            className={this.state.success2 ? "text-success" : "text-danger"}
                            style={{
                                display: this.state.returnMessage2 ? 'inline-block' : 'none',
                                marginBottom: 0,
                            }}
                        >
                            {this.state.returnMessage2}
                        </label>
                        {
                            this.props.permissions.adminUser ?
                            <div
                                className="blips-change-authors-button"
                            >
                                <input
                                    //type="submit"
                                    readOnly
                                    value="Change authors"
                                    className={`submit-btn btn btn-lg ${this.state.success2 === undefined ? 'btn-primary' : (this.state.success2 ? 'btn-success' : 'btn-danger')}`}
                                    onClick={async function(e) {
                                        await parent.handleChangeAuthors();
                                    }}
                                />
                                <ButtonLegend/>
                            </div> : null
                        }
                    </div>
                }
            </div>
        } else {
            return <div className="new-blips-grid">Please login in order to create blips</div>;
        }
    }
}

export default Blips;