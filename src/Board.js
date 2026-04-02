import React from 'react';
import Dragula from 'dragula';
import 'dragula/dist/dragula.css';
import Swimlane from './Swimlane';
import './Board.css';

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    const clients = this.getClients();
    this.state = {
      clients: {
        backlog: clients.filter(client => !client.status || client.status === 'backlog'),
        inProgress: clients.filter(client => client.status && client.status === 'in-progress'),
        complete: clients.filter(client => client.status && client.status === 'complete'),
      }
    }
    this.swimlanes = {
      backlog: React.createRef(),
      inProgress: React.createRef(),
      complete: React.createRef(),
    }
  }
  getClients() {
    return [
      ['1','Stark, White and Abbott','Cloned Optimal Architecture', 'in-progress'],
      ['2','Wiza LLC','Exclusive Bandwidth-Monitored Implementation', 'complete'],
      ['3','Nolan LLC','Vision-Oriented 4Thgeneration Graphicaluserinterface', 'backlog'],
      ['4','Thompson PLC','Streamlined Regional Knowledgeuser', 'in-progress'],
      ['5','Walker-Williamson','Team-Oriented 6Thgeneration Matrix', 'in-progress'],
      ['6','Boehm and Sons','Automated Systematic Paradigm', 'backlog'],
      ['7','Runolfsson, Hegmann and Block','Integrated Transitional Strategy', 'backlog'],
      ['8','Schumm-Labadie','Operative Heuristic Challenge', 'backlog'],
      ['9','Kohler Group','Re-Contextualized Multi-Tasking Attitude', 'backlog'],
      ['10','Romaguera Inc','Managed Foreground Toolset', 'backlog'],
      ['11','Reilly-King','Future-Proofed Interactive Toolset', 'complete'],
      ['12','Emard, Champlin and Runolfsdottir','Devolved Needs-Based Capability', 'backlog'],
      ['13','Fritsch, Cronin and Wolff','Open-Source 3Rdgeneration Website', 'complete'],
      ['14','Borer LLC','Profit-Focused Incremental Orchestration', 'backlog'],
      ['15','Emmerich-Ankunding','User-Centric Stable Extranet', 'in-progress'],
      ['16','Willms-Abbott','Progressive Bandwidth-Monitored Access', 'in-progress'],
      ['17','Brekke PLC','Intuitive User-Facing Customerloyalty', 'complete'],
      ['18','Bins, Toy and Klocko','Integrated Assymetric Software', 'backlog'],
      ['19','Hodkiewicz-Hayes','Programmable Systematic Securedline', 'backlog'],
      ['20','Murphy, Lang and Ferry','Organized Explicit Access', 'backlog'],
    ].map(companyDetails => ({
      id: companyDetails[0],
      name: companyDetails[1],
      description: companyDetails[2],
      status: companyDetails[3],
    }));
  }

  // (New Changes): Calling after component mounts - Setting up Dragula.
  componentDidMount() {
    const {backlog, inProgress, complete} = this.swimlanes;


    this.drake = Dragula([
      backlog.current,
      inProgress.current,
      complete.current,
    ])

    // Fires when a card is dropped.
    this.drake.on('drop',(el,target,source) => {
      // Figure out which swimlane the card was dropped into.
      const targetSwimlane = this.getSwimlaneStatus(target);
      const sourceSwimlane = this.getSwimlaneStatus(source);

      if (!targetSwimlane || targetSwimlane === sourceSwimlane) return;

      this.drake.cancel(true);

      const cardId = el.dataset.id;

      this.setState(prevState=>{

        // Finds the card in the source swinlane.
        const card = prevState.clients[sourceSwimlane].find(c => c.id === cardId);
        if (!card) return;

        // console.log(targetSwimlane, sourceSwimlane);

        // Remove from source, add to target with updated status.
        const updateCard = {...card, status: this.getStatusFromSwimlane(targetSwimlane) };
        return{
          clients:{
            ...prevState.clients,
            [sourceSwimlane]: prevState.clients[sourceSwimlane].filter(c => c.id !== cardId),
            [targetSwimlane]: [...prevState.clients[targetSwimlane], updateCard],
          }
        };
      });
    });
  }

  // (New Changes): Maps DOM ref => state key.
  getSwimlaneStatus(domEl){
    const {backlog, inProgress, complete} = this.swimlanes;

    if (domEl === backlog.current) return 'backlog';
    if (domEl === inProgress.current) return 'inProgress';
    if (domEl === complete.current) return 'complete';

    return null;
  }


  // (New Changes): Map state key => status string - (for card color).
  getStatusFromSwimlane(swimlane){
    const map = {
      backlog: "backlog",
      inProgress: "in-progress",
      complete: "complete",
    }

    return map[swimlane];
  }


  renderSwimlane(name, clients, ref) {
    return (
      <Swimlane name={name} clients={clients} dragulaRef={ref}/>
    );
  }

  render() {
    return (
      <div className="Board">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-4">
              {this.renderSwimlane('Backlog', this.state.clients.backlog, this.swimlanes.backlog)}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane('In Progress', this.state.clients.inProgress, this.swimlanes.inProgress)}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane('Complete', this.state.clients.complete, this.swimlanes.complete)}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
