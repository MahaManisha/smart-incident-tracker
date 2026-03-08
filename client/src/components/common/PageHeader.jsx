import React from 'react';
import PropTypes from 'prop-types';
import './PageHeader.css';

const PageHeader = ({ title, description, actions, children }) => {
    return (
        <div className="page-header-wrapper">
            <div className="page-header-content">
                <h1 className="page-header-title">{title}</h1>
                {description && <p className="page-header-description">{description}</p>}
                {children}
            </div>

            {actions && (
                <div className="page-header-actions">
                    {actions}
                </div>
            )}
        </div>
    );
};

PageHeader.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    actions: PropTypes.node,
    children: PropTypes.node
};

export default PageHeader;
