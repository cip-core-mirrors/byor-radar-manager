import React from 'react';
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

class Blips extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            success: undefined,
            submitting: false,
            returnMessage: undefined,
            rows: [],
            columns: [],
            locked: {},
            allBlipsColumns: [],
            allBlipsRows: [],
        };
    }

    async componentDidMount() {
        this.addColumn('Name');
        this.addColumn('Last update');
        this.setState(this.state);
        
        const response = await this.props.callApi('GET', `${this.props.baseUrl}/blip`)
        if (!response.ok) {
            this.addColumn();
            this.addBlip();
            this.setState(this.state);
            return;
        }

        const columns = {};
        let columnIndex = 0;
        const data = await response.json();
        for (const blipId in data) {
            const blipVersions = data[blipId];
            const lastBlip = blipVersions[blipVersions.length - 1];
            const {
                id,
                id_version,
                lastupdate,
                name,
                version,
            } = lastBlip;
            delete lastBlip.id;
            delete lastBlip.id_version;
            delete lastBlip.lastupdate;
            delete lastBlip.name;
            delete lastBlip.version;
            for (const columnName in lastBlip) {
                const columnExists = columns[columnName];
                if (columnExists === undefined) {
                    this.addColumn(columnName);
                    columns[columnName] = columnIndex;
                    columnIndex++;
                }
            }
            lastBlip.name = name;
            lastBlip.lastupdate = lastupdate;
        }

        let row = 0;
        for (const blipId in data) {
            const blipVersions = data[blipId];
            const lastBlip = blipVersions[blipVersions.length - 1];
            const {
                lastupdate,
                name,
            } = lastBlip;
            delete lastBlip.lastupdate;
            delete lastBlip.name;
            this.addBlip();
            const lastRow = this.state.rows[this.state.rows.length - 1];
            lastRow[0] = name;
            
            const lockedRow = {};
            lockedRow[0] = true;
            const lastUpdateDate = parseDate(lastupdate);
            if (lastUpdateDate) {
                lastRow[1] = `${lastUpdateDate.getFullYear()}-${lastUpdateDate.getMonth() + 1}-${lastUpdateDate.getDate()}`;
                lockedRow[1] = true;
            } else {
                lastRow[1] = '';
            }
            for (const columnName in lastBlip) {
                const columnValue = lastBlip[columnName];
                const columnIndex = columns[columnName];
                lastRow[columnIndex + 2] = columnValue;
            }
            this.state.locked[row] = lockedRow;
            row++;
        }
        
        if (this.state.rows.length === 0) {
            this.addColumn();
            this.addBlip();
        }

        this.setState(this.state);

        await this.refreshAllBlips();
    }

    async refreshAllBlips() {
        const allBlipsResponse = await this.props.callApi('GET', `${this.props.baseUrl}/blips`);
        if (allBlipsResponse.ok) {
            const allBlips = await allBlipsResponse.json();
            const columnsIndex = {};
            for (const blipVersions of Object.values(allBlips)) {
                const blipVersion = blipVersions[blipVersions.length - 1];
                const { id, id_version, lastupdate, name, version } = blipVersion;
                delete blipVersion.id;
                delete blipVersion.id_version;
                delete blipVersion.lastupdate;
                delete blipVersion.name;
                delete blipVersion.version;
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
            }

            this.state.allBlipsRows = [];
            this.state.allBlipsColumns = [];

            this.addAllBlipColumn('Name');
            this.addAllBlipColumn('Last update');
            for (const columnName of Object.keys(columnsIndex)) {
                this.addAllBlipColumn(columnName);
            }
            for (const blipVersions of Object.values(allBlips)) {
                // list all blips
                const blipVersion = blipVersions[blipVersions.length - 1];
                const row = [
                    blipVersion.name,
                ];
                const lastUpdateDate = parseDate(blipVersion.lastupdate);
                if (lastUpdateDate) {
                    row.push(`${lastUpdateDate.getFullYear()}-${lastUpdateDate.getMonth() + 1}-${lastUpdateDate.getDate()}`);
                } else {
                    row.push('');
                }

                for (const entry of Object.entries(columnsIndex)) {
                    const columnName = entry[0];
                    const columnIndex = entry[1];
                    const columnValue = blipVersion[columnName];
                    while (row.length - 2 < columnIndex) {
                        row.push('');
                    }
                    row[columnIndex + 2] = columnValue !== undefined ? columnValue : '';
                }
                this.addAllBlip(row);
            }

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

    async deleteBlip(blipId, rowIndex) {
        console.log(blipId)
        if (blipId) {
            const response = await this.props.callApi('DELETE', `${this.props.baseUrl}/blips/${blipId}`);
            if (response.ok) {
                this.state.rows.splice(rowIndex, 1);
            } else {
                this.state.returnMessage = "Erreur deleting blip";
            }
        } else {
            this.state.rows.splice(rowIndex, 1);
        }
    }

    async handleSubmit() {
        if (this.state.submitting) return;

        const blips = [];
        const columns = this.state.columns.slice(0, 2).map(normalizeColumnName).concat(this.state.columns.slice(2));
        const columnsIndex = {};
        columns.map((value, index) => columnsIndex[index] = value);

        const toLock = {};
        let rowIndex = 0;
        for (const row of this.state.rows) {
            const blip = {};
            const toLockRow = {};
            for (const columnIndex in row) {
                const columnValue = row[columnIndex];
                if (columnValue) {
                    toLockRow[columnIndex] = true;
                    blip[columnsIndex[columnIndex]] = columnValue;
                }
            }
            if (blip.name) blips.push(blip);
            toLock[rowIndex] = toLockRow;
            rowIndex++;
        }

        if (blips.length === 0) return;

        this.state.submitting = true;
        this.setState(this.state);

        const response = await this.props.callApi('POST', `${this.props.baseUrl}/blips`, { blips });
        this.state.success = response.ok;
        const data = await response.json();
        const parent = this;
        if (response.ok) {
            this.state.locked = toLock;
            this.state.returnMessage = `Successfully added ${data.rows} blip${data.rows > 1 ? 's' : ''}`;
            this.refreshAllBlips();
            setTimeout(function() {
                parent.state.success = undefined;
                parent.state.submitting = false;
                parent.state.returnMessage = undefined;
                parent.setState(parent.state);
            }, 5000);
        } else {
            this.state.returnMessage = data.routine;
            setTimeout(function() {
                parent.state.submitting = false;
                parent.setState(parent.state);
            }, 2000);
        }

        this.setState(this.state);
    }

    render() {
        const parent = this;

        if (this.props.authenticated) {
            return <div className="new-blips-grid">
                <h3>My blips</h3>
                <table
                    className="new-blips-table"
                    id="new-blips-table"
                >
                    <thead>
                        <tr>
                            <th className="fit-width"/>
                            {
                                this.state.columns.map((columnName, index) =>
                                    <th
                                        key={index}
                                        scope="col"
                                        className={index === 1 ? "fit-width" : "new-blips-table-column"}
                                        style={{
                                            paddingRight: index === 1 ? '1.5em': undefined,
                                        }}
                                    >
                                        {
                                            index < 2 ? columnName :
                                            <input
                                                type="text"
                                                className="form-control form-control-alt"
                                                placeholder={columnName ? null : "Column name"}
                                                value={columnName}
                                                onChange={function(e) {
                                                    parent.state.columns[index] = e.target.value;
                                                    parent.setState(parent.state);
                                                }}
                                            />
                                        }
                                    </th>
                                )
                            }
                            <th>
                                <button
                                    className="btn btn-lg btn-flat-primary new-column-btn fit-width"
                                    onClick={function(e) {
                                        parent.addColumn();
                                        parent.setState(parent.state);
                                        setTimeout(function() {
                                            const table = document.getElementById("new-blips-table");
                                            const thead = table.firstChild;
                                            console.log(thead)
                                            console.log(thead.offsetWidth)
                                            table.scrollLeft = thead.offsetWidth;
                                        }, 50)
                                    }}
                                >
                                    <i className="icon icon-md">add</i>
                                    <span className="new-sector-btn-label">Add column</span>
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.state.rows.map((row, rowIndex) =>
                                <tr
                                    key={rowIndex}
                                >
                                    <td>
                                        <button
                                            className="btn btn-lg"
                                            onClick={async function(e) {
                                                await parent.deleteBlip(row[0], rowIndex);
                                                parent.setState(parent.state);
                                            }}
                                        >
                                            <i className="icon icon-md">delete</i>
                                        </button>
                                    </td>
                                    {
                                        row.map((columnValue, index) => 
                                            <td
                                                key={index}
                                                className="table-cell"
                                            >
                                                {
                                                    index < 2 && this.state.locked[rowIndex] && this.state.locked[rowIndex][index] ? columnValue :
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-alt"
                                                        value={columnValue}
                                                        placeholder={index === 1 ? 'YYYY-MM-DD (optional)' : ''}
                                                        style={{
                                                            width: index === 1 ? '175px' : undefined,
                                                        }}
                                                        onChange={function(e) {
                                                            row[index] = e.target.value;
                                                            parent.setState(parent.state);
                                                        }}
                                                    />
                                                }
                                            </td>
                                        )
                                    }
                                </tr>
                            )
                        }
                    </tbody>
                </table>
                <button
                    className="btn btn-lg btn-flat-primary new-blip-btn"
                    onClick={function(e) {
                        parent.addBlip();
                        parent.setState(parent.state);
                    }}
                >
                    <i className="icon icon-md">add</i>
                    <span className="new-sector-btn-label">Add blip</span>
                </button>
                <label
                    className={this.state.success ? "text-success" : "text-danger"}
                    style={{
                        display: this.state.returnMessage ? 'inline-block' : 'none',
                        marginBottom: 0,
                    }}
                >
                    {this.state.returnMessage}
                </label>
                <input
                    //type="submit"
                    readOnly
                    value="Submit"
                    className={`new-blips-submit-btn btn btn-lg ${this.state.success === undefined ? 'btn-primary' : (this.state.success ? 'btn-success' : 'btn-danger')}`}
                    onClick={async function(e) {
                        await parent.handleSubmit();
                    }}
                />
                <h3>All blips</h3>
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
                    <tbody>
                        {
                            this.state.allBlipsRows.map((row, rowIndex) =>
                                <tr
                                    key={rowIndex}
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
                                                    {columnValue}
                                                </div>
                                            </td>
                                        )
                                    }
                                </tr>
                            )
                        }
                    </tbody>
                </table>
            </div>
        } else {
            return <div className="new-blips-grid">Please login in order to create blips</div>;
        }
    }
}

export default Blips;