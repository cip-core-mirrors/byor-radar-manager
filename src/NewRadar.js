import React from 'react';
import './NewRadar.css';

class NewRadar extends React.Component {
    constructor(props) {
        super(props)
    }

    async componentDidMount() {
    }

    handleChange = (event) => {

    };

    handleSubmit = (event) => {
        console.log(this.props.userInfo)
    };

    render() {
        if (this.props.authenticated) {
            return (
                <div className="new-radar">
                    <form className="create-radar">
                        <div className="form-group">
                            <label className="paramName">Radar name &nbsp;</label>
                            <input
                                type="text"
                                className="form-control form-control-alt"
                                id="radar-id"
                                onChange={this.handleChange}
                            />
                        </div>
                    </form>
                    <input
                        readOnly
                        value="Create radar"
                        className="submit-btn btn btn-lg btn-primary"
                        onClick={this.handleSubmit}
                    />
                </div>
            );
        } else {
            return (
                <div className="new-radar">Please login in order to create a radar</div>
            )
        }
    }
}

export default NewRadar;