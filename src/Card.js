import React from 'react';
import './Card.css';

export default class Card extends React.Component {
  render(){
    return(
      <div className = {`Card Card-${this.props.status}`} data-id = {this.props.id}>
        <div className = 'Card-title'>{this.props.name}</div>
        <div className = 'Card-description'>{this.props.description}</div>
      </div>
    )
  }
}