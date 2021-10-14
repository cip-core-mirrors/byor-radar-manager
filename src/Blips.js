import React from 'react';
import './Blips.css';

function normalizeColumnName(name) {
    const words = name.split(' ');
    return words[0].toLowerCase() + words.slice(1).map(n => n[0].toUpperCase() + n.slice(1))
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
        };
    }

    async componentDidMount() {
        this.addColumn('Name');
        this.addColumn('Last updated');
        this.addColumn();
        this.addBlip();

        this.setState(this.state);
    }

    addBlip() {
        const row = [];
        while (row.length < this.state.columns.length) {
            row.push('');
        }
        this.state.rows.push(row);
    }

    addColumn(columnName = 'Column name') {
        this.state.columns.push(columnName);
        for (const row of this.state.rows) {
            row.push('');
        }
    }

    async handleSubmit() {
        if (this.state.submitting) return;

        const blips = [];
        const columns = this.state.columns.slice(0, 2).map(normalizeColumnName).concat(this.state.columns.slice(2));
        const columnsIndex = {};
        columns.map((value, index) => columnsIndex[index] = value);

        for (const row of this.state.rows) {
            const blip = {};
            for (const columnIndex in row) {
                const columnValue = row[columnIndex];
                blip[columnsIndex[columnIndex]] = columnValue || undefined;
            }
            if (blip.name) blips.push(blip);
        }

        if (blips.length === 0) return;

        this.state.submitting = true;
        this.setState(this.state);

        const response = await this.props.callApi('PUT', `${this.props.baseUrl}`, { blips });
        this.state.success = response.ok;
        const data = await response.json();
        const parent = this;
        if (response.ok) {
            this.state.returnMessage = `Successfully added ${data.rows} blip${data.rows > 1 ? 's' : ''}`;
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
        if (!this.props.permissions.createBlips) {
            return <div className="new-blips-grid">
                <table
                    className="new-blips-table"
                >
                    <thead>
                        <tr>
                            {
                                this.state.columns.map((columnName, index) =>
                                    <th
                                        key={index}
                                        scope="col"
                                    >
                                        {
                                            index < 2 ? columnName :
                                            <input
                                                type="text"
                                                className="form-control form-control-alt"
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
                            <button
                                className="btn btn-lg btn-flat-primary new-column-btn"
                                onClick={function(e) {
                                    parent.addColumn();
                                    parent.setState(parent.state);
                                }}
                            >
                                <i className="icon icon-md">add</i>
                                <span className="new-sector-btn-label">Add column</span>
                            </button>
                        </tr>
                    </thead>
                    <tbody>
                        {
                            this.state.rows.map((row, rowIndex) =>
                                <tr
                                    key={rowIndex}
                                >
                                    {
                                        row.map((columnValue, index) => 
                                            <td
                                                key={index}
                                            >
                                                <input
                                                    type="text"
                                                    className="form-control form-control-alt"
                                                    value={columnValue}
                                                    onChange={function(e) {
                                                        row[index] = e.target.value;
                                                        parent.setState(parent.state);
                                                    }}
                                                />
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
            </div>
        } else if (this.props.authenticated) {
            return <div className="new-blips-grid">
                You are not authorized to create blips
            </div>
        } else {
            return null;
        }
    }
}

export default Blips;