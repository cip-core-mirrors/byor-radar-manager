import React from 'react';
import './Blips.css';

class Blips extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
        }
    }

    render() {
        const parent = this;
        const state = parent.state;
        if (this.props.permissions.createBlips) {
            return (
                <div className="new-blips-grid">
                    Create blips page (build in progress)
                </div>
            )
        } else if (this.props.authenticated) {
            return (
                <div className="new-radar-grid border-top">
                    <div className="new-radar">You are not authorized to create blips</div>
                </div>
            )
        } else {
            return null;
        }
    }
}

export default Blips;