import React from 'react';

import Spinner from './Spinner';
import './Themes.css';

const createId = 'create-theme-input';

class Themes extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            isFirstRefresh: true,
            submitting: false,
            success1: undefined,
            returnMessage1: undefined,
            success2: undefined,
            deleteSuccess: undefined,
            returnMessage2: undefined,
            newTheme: undefined,
            selectedTheme: undefined,
            defaultParameters: [],
            parameters: [],
            themesPermissions: [],
        };
    }

    async componentDidMount() {
        if (this.state.isFirstRefresh) {
            if (!this.props.isLoggingIn) {
                this.firstRefresh();
            }
        }
    }

    async reloadParameters(themeId) {
        this.state.parameters = JSON.parse(JSON.stringify(this.state.defaultParameters));
        if (themeId) {
            const response = await this.props.callApi('GET', `${this.props.baseUrl}/themes/${themeId}`);
            if (response.ok) {
                const parameters = await response.json();
                for (const parameter of parameters) {
                    for (const parameterUI of this.state.parameters) {
                        if (parameter.name === parameterUI.name) {
                            parameterUI.value = parameter.value;
                            break;
                        }
                    }
                }
            }
        }
        
        this.state.submitting = false;
        this.state.success1 = undefined;
        this.state.returnMessage1 = undefined;
        this.state.success2 = undefined;
        this.state.deleteSuccess = undefined;
        this.state.returnMessage2 = undefined;
    }

    async reloadThemesList() {
        const response = await this.props.callApi('GET', `${this.props.baseUrl}/themes`);
        if (response.ok) {
            this.state.themesPermissions = await response.json();
            this.state.themesPermissions.sort(function(a, b) {
                if (a.id < b.id) return -1;
                else if (a.id > b.id) return 1;
                return 0;
            });
            this.setState(this.state);
        }
    }

    async createTheme(themeId) {
        const url = `${this.props.baseUrl}/themes`;
        const theme = {};
        theme.id = themeId;
        return await this.props.callApi('POST', url, theme);
    }

    async handleSubmit() {
        if (this.state.submitting) return;
        this.state.submitting = true;
        this.setState(this.state);
        
        const theme = {};
        theme.id = this.state.selectedTheme;
        theme.parameters = this.state.parameters;

        const url = `${this.props.baseUrl}/themes`;
        const response = await this.props.callApi('PUT', url, theme);
        this.state.success2 = response.ok;
        const parent = this;
        if (response.ok) {
            this.state.returnMessage2 = "Successfully edited theme";
            setTimeout(function() {
                parent.state.success2 = undefined;
                parent.state.submitting = false;
                parent.state.returnMessage2 = undefined;
                parent.setState(parent.state);
            }, 5000);
        } else {
            const data = await response.json();
            this.state.returnMessage2 = data.routine;
            setTimeout(function() {
                parent.state.submitting = false;
                parent.setState(parent.state);
            }, 2000);
        }
        this.setState(this.state);
    }

    async handleDelete() {
        if (this.state.submitting) return;
        this.state.submitting = true;
        this.setState(this.state);
        
        const themeId = this.state.selectedTheme;

        const url = `${this.props.baseUrl}/themes/${themeId}`;
        const response = await this.props.callApi('DELETE', url);
        this.state.deleteSuccess = response.ok;
        const parent = this;
        if (response.ok) {
            this.state.returnMessage2 = "Successfully deleted theme";
            this.state.selectedTheme = undefined;
            await this.reloadThemesList();
            setTimeout(function() {
                parent.state.deleteSuccess = undefined;
                parent.state.submitting = false;
                parent.state.returnMessage2 = undefined;
                parent.setState(parent.state);
            }, 5000);
        } else {
            const data = await response.json();
            this.state.returnMessage2 = data.routine;
            setTimeout(function() {
                parent.state.submitting = false;
                parent.setState(parent.state);
            }, 2000);
        }
        this.setState(this.state);
    }

    async firstRefresh() {
        this.state.isFirstRefresh = false;
        this.setState(this.state);
        
        const response = await this.props.callApi('GET', `${this.props.baseUrl}/parameters/themes`);
        if (response.ok) {
            this.state.defaultParameters = await response.json();
        }
        await this.reloadThemesList();

        this.state.isLoading = false;
        this.setState(this.state);
    }
    
    async componentDidUpdate() {
        if (this.state.isFirstRefresh) {
            if (!this.props.isLoggingIn) {
                this.firstRefresh();
            }
        }
    }

    render() {
        if (this.props.isLoggingIn || this.state.isLoading) return <Spinner/>;

        const params = [];
        const fieldSets = {};
        const parameters = this.state.parameters;
        for (const param of parameters) {
            if (param.fieldset) {
                let fieldSet = fieldSets[param.fieldset];
                if (!fieldSet) {
                    fieldSet = [];
                    fieldSets[param.fieldset] = fieldSet;
                    params.push({
                        paramType: 'fieldset',
                        name: param.fieldset,
                    });
                }
                fieldSet.push(param)
            } else {
                param.paramType = 'param';
                params.push(param)
            }
        }

        const parent = this;

        if (this.props.authenticated) {
            const themePermissions = this.state.themesPermissions.filter(theme => theme.id === this.state.selectedTheme && theme.user_id === this.props.userInfo.mail)[0];
            const permissions = themePermissions ? themePermissions.rights.split(',') : [];
            const isOwner = permissions.indexOf('owner') !== -1;
            const isEditor = permissions.indexOf('edit') !== -1;
            const isViewer = !isOwner && !isEditor;

            const form = <form className="parameters">
                {params.map(function(param) {
                    if (param.paramType === 'param') {
                        if (param.type === 'boolean') {
                            return (
                                <div className="form-group" key={param.name}>
                                    <div className="custom-control custom-checkbox">
                                        <input
                                            readOnly={isViewer}
                                            type="checkbox"
                                            className="custom-control-input"
                                            name={param.name}
                                            id={param.name}
                                            defaultChecked={(param.value || param.defaultValue) === '1'}
                                            onClick={function(e) {
                                                param.value = param.value === '1' ? '0' : '1';
                                            }}
                                        />
                                        <label className="paramName custom-control-label" htmlFor={param.name}>{param.name}&nbsp;</label>
                                        {
                                            param.tooltip ?
                                                <span className="help-tooltip">
                                                    <i className="icon icon-md">help_outline</i>
                                                    <div className="tooltip bs-tooltip-top" role="tooltip">
                                                        <div className="tooltip-inner">{param.tooltip}</div>
                                                    </div>
                                                </span>
                                            : <span className="help-tooltip"/>
                                        }
                                    </div>
                                </div>
                            )
                        } else if (param.name === 'titlePageHTML') {
                            return (
                                <div className="form-group" key={param.name}>
                                    <label className="paramName">{param.name}&nbsp;</label>
                                    {
                                        param.tooltip ?
                                            <span className="help-tooltip">
                                                <i className="icon icon-md">help_outline</i>
                                                <div className="tooltip bs-tooltip-top" role="tooltip">
                                                    <div className="tooltip-inner">{param.tooltip}</div>
                                                </div>
                                            </span>
                                        : <span className="help-tooltip"/>
                                    }
                                    <textarea
                                        readOnly={isViewer}
                                        className="form-control form-control-lg"
                                        id={param.name}
                                        rows="5"
                                        style={{
                                            marginBottom: '1em',
                                        }}
                                        defaultValue={param.value || (param.default || "")}
                                        onChange={function(e) {
                                            param.value = e.target.value
                                        }}
                                    />
                                    <div className="dangerousInnerHTML border-bottom border-top border-left border-right" dangerouslySetInnerHTML={{
                                        __html: param.value,
                                    }} />
                                </div>
                            )
                        }
                        return (
                            <div className="form-group" key={param.name}>
                                <label className="paramName">{param.name}&nbsp;</label>
                                {
                                    param.tooltip ?
                                        <span className="help-tooltip">
                                            <i className="icon icon-md">help_outline</i>
                                            <div className="tooltip bs-tooltip-top" role="tooltip">
                                                <div className="tooltip-inner">{param.tooltip}</div>
                                            </div>
                                        </span>
                                    : <span className="help-tooltip"/>
                                }
                                <input
                                    readOnly={isViewer}
                                    type="text"
                                    className="form-control form-control-alt"
                                    id={param.name}
                                    defaultValue={param.value || (param.default || "")}
                                    onChange={function(e) {
                                        param.value = e.target.value
                                    }}
                                />
                            </div>
                        )
                    } else {
                        const fieldParams = fieldSets[param.name];
                        return (
                            <fieldset key={param.name}>
                                <legend>{param.name}</legend>
                                {fieldParams.map(function(fParam) {
                                    return (
                                        <div className="form-group" key={fParam.name}>
                                            <label className="paramName">{fParam.name}</label>
                                            {
                                                fParam.tooltip ?
                                                    <span className="help-tooltip">
                                                        <i className="icon icon-md">help_outline</i>
                                                        <div className="tooltip bs-tooltip-top" role="tooltip">
                                                            <div className="tooltip-inner">{fParam.tooltip}</div>
                                                        </div>
                                                    </span>
                                                : <span className="help-tooltip"/>
                                            }
                                            <input
                                                readOnly={isViewer}
                                                type="text"
                                                className="form-control form-control-alt"
                                                id={fParam.name}
                                                defaultValue={fParam.value || (fParam.default || "")}
                                                onChange={function(e) {
                                                    fParam.value = e.target.value
                                                }}
                                            />
                                        </div>
                                    )
                                })}
                            </fieldset>
                        )
                    }
                })}
            </form>;

            const submit = (isOwner || isEditor) ? <input
                //type="submit"
                readOnly
                value="Submit"
                className={`new-blips-submit-btn btn btn-lg ${this.state.success2 === undefined ? 'btn-primary' : (this.state.success2 ? 'btn-success' : 'btn-danger')}`}
                onClick={async function(e) {
                    await parent.handleSubmit();
                }}
            /> : null;
            const deleteButton = isOwner ? <input
                //type="submit"
                readOnly
                value="Delete"
                className={`new-blips-submit-btn btn btn-lg ${this.state.deleteSuccess === undefined ? 'btn-primary' : (this.state.deleteSuccess ? 'btn-success' : 'btn-danger')}`}
                onClick={async function(e) {
                    await parent.handleDelete();
                }}
            /> : null;

            const createForm = <form className="create-radar">
                <div className="form-group">
                    <label className="paramName">Theme name &nbsp;</label>
                    <input
                        type="text"
                        className="form-control form-control-alt"
                        id={createId}
                    />
                    <label
                        className="text-danger"
                        style={{
                            display: this.state.returnMessage1 ? 'inline-block' : 'none',
                            marginBottom: 0,
                        }}
                    >
                        {this.state.returnMessage1}
                    </label>
                </div>
            </form>;

            const createSubmit = <input
                readOnly
                value="Create theme"
                className="submit-btn btn btn-lg btn-primary"
                onClick={async function(e) {
                    const element = document.getElementById(createId);
                    let themeId = (element.value || '').trim();
                    themeId = themeId.toLowerCase();
                    themeId = themeId.replace(/\s\s+/g, ' ');
                    themeId = themeId.replace(/ /g, '-');
                    const match = themeId.match(/^[a-z0-9\-]+$/i);
                    if (themeId.length < 3) {
                        parent.state.returnMessage1 = 'Name too short (must be at least 3 characters)';
                    } else if (themeId.length > 256) {
                        parent.state.returnMessage1 = 'Name too long (should not exceed 256 characters)';
                    } else if (match) {
                        const response = await parent.createTheme(themeId);
                        if (response.ok) {
                            await parent.reloadThemesList();
                            element.value = '';
                        } else if (response.status === 404) {
                            const data = await response.json();
                            this.state.errorMessage = data.message;
                        }
                    } else {
                        parent.state.returnMessage1 = 'Name should be alphanumerical';
                    }

                    parent.setState(parent.state);
                }}
            />;

            return <div
                className="theme-grid"
            >
                <h3>My themes</h3>
                <div>Select a theme to edit it</div>
                <select
                    className="custom-select"
                    size="4"
                    onClick={async function(e) {
                        const target = e.target;
                        if (target.tagName !== 'OPTION') return;
                        if (target.value === parent.state.selectedTheme) return;

                        parent.state.selectedTheme = target.value;
                        await parent.reloadParameters(parent.state.selectedTheme);
                        parent.setState(parent.state);
                    }}
                >
                {
                    this.state.themesPermissions.map(theme => 
                        <option
                            value={theme.id}
                            key={theme.id}
                        >
                            {theme.id} {theme.user_id === this.props.userInfo.mail ? (
                                theme.rights.split(',').indexOf('owner') !== -1 ? '(owner)' : '(edit)'
                            ) : ''}
                        </option>
                    )
                }
                </select>
                {
                    this.state.selectedTheme ? <div className="selected-theme" key={this.state.selectedTheme}>
                        {form}
                        <label
                            className={this.state.success2 ? "text-success" : "text-danger"}
                            style={{
                                display: this.state.returnMessage2 ? 'inline-block' : 'none',
                                marginBottom: 0,
                            }}
                        >
                            {this.state.returnMessage2}
                        </label>
                        <div className="buttons-grid">
                            {submit}
                            {deleteButton}
                        </div>
                    </div> :
                    <div className="create-theme">
                        {createForm}
                        {createSubmit}
                    </div>
                }
            </div>
        } else {
            return <div className="theme-grid">Please login in order to create themes</div>
        }
    }
}

export default Themes;