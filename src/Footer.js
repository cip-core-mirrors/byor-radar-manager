
import React from 'react';

class Footer extends React.Component {
    render() {
        return <footer className="sgbs-footer-light border-top d-flex justify-content-between p-3">
            <span className="sgbs-footer-item h6 mb-0 font-weight-normal">© Societe Generale Group 2018</span>
            <ul className="list-unstyled d-flex mb-0">
                <li className="ml-3">
                    <a className="sgbs-footer-item h6 mb-0 font-weight-normal" href="#compact">About
                    </a>
                </li>
                <li className="ml-3">
                    <a className="sgbs-footer-item h6 mb-0 font-weight-normal" href="#compact">Legal notices <em
                        className="icon">keyboard_arrow_up</em>
                    </a>
                </li>
                <li className="ml-3">
                    <a className="sgbs-footer-item h6 mb-0 font-weight-normal" href="#compact">Contact
                    </a>
                </li>
            </ul>
        </footer>
    }
}

export default Footer;