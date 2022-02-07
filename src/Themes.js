import React from 'react';

import Spinner from './Spinner';
import ButtonLegend from './ButtonLegend';
import './Themes.css';

const createId = 'create-theme-input';

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

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
            success3: undefined,
            returnMessage3: undefined,
            newTheme: undefined,
            selectedTheme: undefined,
            defaultParameters: [],
            parameters: [],
            themesPermissions: [],
            adminUrl: this.props.baseUrl + '/admin',
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
            const iframe = document.getElementById("radar-preview");
            const iframeSrc = iframe.src;
            iframe.src = '';
            iframe.src = iframeSrc;
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

    async editEditors(editors, themeId) {
        if (this.state.submitting) return;
        this.state.submitting = true;
        this.setState(this.state);

        const theme = {
            id: themeId,
            permissions: editors.map(function(editor) {
                editor.rights = editor.rights.split(',');
                editor.userId = editor.user_id;
                delete editor.user_id;
                return editor;
            }),
        };

        const response = await this.props.callApi('PUT', `${this.props.baseUrl}/themes`, theme);
        if (response.ok) {
            document.getElementById(`add-editor-${themeId}`).value = '';
            await this.reloadThemesList();
        } else if (response.state === 403) {
            const data = await response.json();
            this.state.errorMessage = data.message;
        }
        
        this.state.submitting = false;
        this.setState(this.state);
    }

    async duplicateTheme(oldThemeId, newThemeId) {
        if (this.state.submitting) return;
        this.state.submitting = true;
        this.state.success3 = undefined;
        this.state.returnMessage3 = undefined;
        this.setState(this.state);
        
        const url = `${this.props.baseUrl}/themes/${oldThemeId}/duplicate`;
        const body = { id: newThemeId };
        const response = await this.props.callApi('POST', url, body);
        this.state.success3 = response.ok;

        const parent = this;
        if (response.ok) {
            this.state.returnMessage3 = "Successfully duplicated theme";
            this.state.selectedTheme = undefined;
            await this.reloadThemesList();
            setTimeout(function() {
                parent.state.success3 = undefined;
                parent.state.submitting = false;
                parent.state.returnMessage3 = undefined;
                parent.setState(parent.state);
            }, 5000);
        } else {
            const data = await response.json();
            this.state.returnMessage3 = data.message;
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
                                        <label className="paramName custom-control-label" htmlFor={param.name}>{param.displayName || param.name}&nbsp;</label>
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
                                    <label className="paramName">{param.displayName || param.name}&nbsp;</label>
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
                                <label className="paramName">{param.displayName || param.name}&nbsp;</label>
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
                                            <label className="paramName">{fParam.displayName || fParam.name}</label>
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
                className={`submit-btn btn btn-lg ${this.state.success2 === undefined ? 'btn-primary' : (this.state.success2 ? 'btn-success' : 'btn-danger')}`}
                onClick={async function(e) {
                    await parent.handleSubmit();
                }}
            /> : null;
            const deleteButton = isOwner ? <input
                //type="submit"
                readOnly
                value="Delete"
                className={`submit-btn btn btn-lg ${this.state.deleteSuccess === undefined ? 'btn-primary' : (this.state.deleteSuccess ? 'btn-success' : 'btn-danger')}`}
                onClick={async function(e) {
                    await parent.handleDelete();
                }}
            /> : null;

            const createForm = <form className="create-radar">
                <div
                    className="form-group"
                    style={{
                        marginBottom: 0,
                    }}
                >
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

            let editors = undefined;
            let themeSelf = undefined;
            if (this.state.selectedTheme) {
                editors = this.state.themesPermissions.filter(permission => permission.id === this.state.selectedTheme);
                editors.sort(function(a, b) {
                    const isOwnerA = a.rights.split(',').indexOf('owner') !== -1;
                    if (isOwnerA) return -1;
                    const isOwnerB = b.rights.split(',').indexOf('owner') !== -1;
                    if (isOwnerB) return 1;

                    if (a.user_id < b.user_id) return 1;
                    else if (a.user_id > b.user_id) return -1;
                    return 0;
                });
                themeSelf = editors.filter(permission => permission.user_id === this.props.userInfo.mail)[0];
                if (!themeSelf) themeSelf = {
                    id: this.state.selectedTheme,
                    user_id: this.props.userInfo.mail,
                    rights: '',
                };
            }

            const themes = this.state.themesPermissions.map(theme => theme.id).filter(onlyUnique);
            const userPermissions = this.state.themesPermissions.filter(permission => permission.user_id === this.props.userInfo.mail);
            const themesWithUserPermissions = themes.map(function(themeId) {
                const themePermission = userPermissions.filter(permission => permission.id === themeId)[0];
                return {
                    id: themeId,
                    rights: themePermission ? themePermission.rights : '',
                };
            });

            return <div
                className="theme-grid"
            >
                <h3>My themes</h3>
                <div className="themes-metadata">
                    <div className="themes-metadata-left">
                        <div className="themes-select">
                            <div className="font-weight-bold text-secondary">
                                Select a theme to edit it
                            </div>
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
                                    themesWithUserPermissions.map(theme => 
                                        <option
                                            value={theme.id}
                                            key={theme.id}
                                        >
                                            {theme.id} {
                                                theme.rights.split(',').indexOf('owner') !== -1 ? '(owner)' :
                                                (
                                                    theme.rights.split(',').indexOf('edit') !== -1 ? '(edit)' :
                                                    ''
                                                )}
                                        </option>
                                    )
                                }
                            </select>
                        </div>
                        {
                            this.state.selectedTheme ?
                            <ul
                                className="themes-permissions list-group-flush"
                                style={{
                                    paddingLeft: 0,
                                }}
                            >
                                <p
                                    className="font-weight-bold text-secondary"
                                    style={{
                                        marginBottom: 0,
                                    }}
                                >
                                    Editors
                                </p>
                                {
                                    editors.map(permission => 
                                        <li
                                            key={permission.user_id}
                                            className="radar-editor-item list-group-item border-light"
                                        >
                                            <label>
                                                <label
                                                    className={this.props.userInfo.mail === permission.user_id ? 'font-weight-bold' : ''}
                                                    style={{
                                                        marginBottom: 0,
                                                    }}
                                                >
                                                    {permission.user_id}
                                                </label>
                                                <label
                                                    className="text-light"
                                                    style={{
                                                        marginBottom: 0,
                                                    }}
                                                >
                                                    &nbsp;
                                                    {
                                                        permission.rights.indexOf('owner') !== -1 ? '- owner' : ''
                                                    }
                                                </label>
                                            </label>
                                            {
                                                (this.props.permissions.adminUser || themeSelf.rights.split(',').indexOf('owner') !== -1) ? 
                                                <button
                                                    className="btn btn-lg btn-discreet-danger"
                                                    type="button"
                                                    onClick={async function(e) {
                                                        const editorsCopy = JSON.parse(JSON.stringify(editors));
                                                        const editorsId = editorsCopy.map(editor => editor.user_id);
                                                        const index = editorsId.indexOf(permission.user_id);
                                                        const removed = editorsCopy.splice(index, 1)[0];
                                                        if (removed.rights.split(',').indexOf('owner') !== -1 && editorsCopy.length > 0) {
                                                            const firstEditor = editorsCopy[0];
                                                            const rights = firstEditor.rights.split(',');
                                                            rights.push('owner');
                                                            firstEditor.rights = rights.join(',');
                                                        }

                                                        await parent.editEditors(editorsCopy, parent.state.selectedTheme);
                                                    }}
                                                >
                                                    <i className="icon">remove</i>
                                                </button> :
                                                null
                                            }
                                        </li>
                                    )
                                }
                                {
                                    (this.props.permissions.adminUser || themeSelf.rights.split(',').indexOf('owner') !== -1) ?
                                    <div
                                        className="input-group mb-3"
                                        style={{
                                            marginTop: "0.3em",
                                        }}
                                    >
                                        <input className="form-control form-control-lg" id={`add-editor-${themeSelf.id}`} type="text" placeholder="john.doe@socgen.com" aria-label="" />
                                        <button
                                            className="btn btn-lg btn-discreet-success"
                                            type="button"
                                            onClick={async function(e) {
                                                const email = document.getElementById(`add-editor-${themeSelf.id}`).value;
                                                
                                                const editorsCopy = JSON.parse(JSON.stringify(editors));
                                                editorsCopy.push({
                                                    id: parent.state.selectedTheme,
                                                    user_id: email,
                                                    rights: 'edit',
                                                });

                                                parent.editEditors(editorsCopy, parent.state.selectedTheme);
                                            }}
                                        >
                                            <i className="icon">add</i>
                                        </button>
                                    </div> : null
                                }
                            </ul>
                            : null
                        }
                        {
                            this.state.selectedTheme ?
                                <div className="duplicate-theme">
                                    <label className="paramName">Theme name &nbsp;:</label>
                                    <input
                                        type="text"
                                        className="form-control form-control-alt"
                                        id={"duplicate-theme"}
                                    />
                                    <input
                                        readOnly={true}
                                        style={{
                                            alignSelf: "center",
                                        }}
                                        className="submit-btn btn btn-lg btn-primary"
                                        value="Duplicate"
                                        onClick={function(e) {
                                            const oldThemeId = parent.state.selectedTheme;
                                            const element = document.getElementById('duplicate-theme')
                                            const newThemeId = (element.value || '').trim();
                                            parent.duplicateTheme(oldThemeId, newThemeId);
                                        }}
                                    />
                                    <label
                                        className={this.state.success3 ? "text-success" : "text-danger"}
                                        style={{
                                            display: this.state.returnMessage3 ? 'inline-block' : 'none',
                                        }}
                                    >
                                        {this.state.returnMessage3}
                                    </label>
                                </div>
                            : null
                        }
                    </div>
                    {
                        this.state.selectedTheme ?
                        <iframe
                            id="radar-preview"
                            src={`${process.env.REACT_APP_RADAR_URL}?sheetId=markdown&browserTheme=${this.state.selectedTheme}`}
                            style={{
                                border: "none",
                                marginTop: "1em",
                            }}
                            width="100%" height="890"
                            onload='javascript:(function(o){o.style.height=o.contentWindow.document.body.scrollHeight+"px";}(this));'
                        /> : null
                    }
                </div>
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
                        <div className="buttons-legend-grid">
                            <div className="buttons-grid">
                                {submit}
                                {deleteButton}
                            </div>
                            <ButtonLegend/>
                        </div>
                    </div> :
                    <div className="create-theme">
                        {createForm}
                        {createSubmit}
                        <ButtonLegend/>
                    </div>
                }
            </div>
        } else {
            return <div className="theme-grid">Please login in order to create themes</div>
        }
    }
}

export default Themes;