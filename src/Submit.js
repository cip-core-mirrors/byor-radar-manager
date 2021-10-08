import React from 'react';

class Submit extends React.Component {
    constructor(props) {
        super(props);
        this.handleSubmit = this.handleSubmit.bind(this);

        this.state = {
            submitting: false,
            success: undefined,
        };
    }

    async handleSubmit(e) {
        if (this.state.submitting) {
            return;
        }

        this.state.submitting = true;
        this.setState(this.state);

        const response = await this.props.onSubmit();
        if (response.ok) {
            this.state.success = true;
        } else {
            this.state.success = false;
        }

        this.setState(this.state);
        const parent = this;
        setTimeout(() => {
            parent.state.success = undefined;
            parent.state.submitting = false;
            parent.setState(this.state);
        }, 5000);
    }

    render() {
        return (
            <input
                //type="submit"
                readOnly
                value="Submit"
                className={`submit-btn btn btn-lg ${this.state.success === undefined ? 'btn-primary' : (this.state.success ? 'btn-success' : 'btn-danger')}`}
                onClick={this.handleSubmit}
            />
        );
    }
}

export default Submit;