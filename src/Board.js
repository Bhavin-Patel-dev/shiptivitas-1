import React from "react";
import Dragula from "dragula";
import "dragula/dist/dragula.css";
import Swimlane from "./Swimlane";
import "./Board.css";

const API_URL = "http://localhost:3001/api/v1/clients";

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      clients: {
        backlog: [],
        inProgress: [],
        complete: [],
      },
    };
    this.swimlanes = {
      backlog: React.createRef(),
      inProgress: React.createRef(),
      complete: React.createRef(),
    };
  }

  // Fetch clients from API and sort into swimlanes
  componentDidMount() {
    fetch(API_URL)
      .then((res) => res.json())
      .then((clients) => {
        // Sort each swimlane by priority before setting state
        this.setState(
          {
            clients: {
              backlog: clients
                .filter((c) => c.status === "backlog")
                .sort((a, b) => a.priority - b.priority),
              inProgress: clients
                .filter((c) => c.status === "in-progress")
                .sort((a, b) => a.priority - b.priority),
              complete: clients
                .filter((c) => c.status === "complete")
                .sort((a, b) => a.priority - b.priority),
            },
          },
          () => {
            // Setup Dragula AFTER state is set and cards are rendered
            this.setupDragula();
          },
        );
      })
      .catch((err) => console.error("Failed to fetch clients:", err));
  }

  // Separated Dragula setup into its own method
  setupDragula() {
    const { backlog, inProgress, complete } = this.swimlanes;

    this.drake = Dragula([
      backlog.current,
      inProgress.current,
      complete.current,
    ]);

    this.drake.on("drop", (el, target, source) => {
      const targetSwimlane = this.getSwimlaneStatus(target);
      const sourceSwimlane = this.getSwimlaneStatus(source);

      if (!targetSwimlane) return;

      this.drake.cancel(true);

      const cardId = el.dataset.id;

      this.setState((prevState) => {
        const sourceClients = prevState.clients[sourceSwimlane];
        const targetClients = prevState.clients[targetSwimlane];

        // Find the card being moved
        const card = sourceClients.find((c) => String(c.id) === String(cardId));
        if (!card) return null;

        // Figure out drop position using DOM order
        const targetDOMChildren = Array.from(target.children);
        const droppedIndex = targetDOMChildren.indexOf(el);
        const newPriority = droppedIndex + 1;

        // Same swimlane reorder
        if (targetSwimlane === sourceSwimlane) {
          const reordered = sourceClients.filter(
            (c) => String(c.id) !== String(cardId),
          );
          reordered.splice(droppedIndex, 0, card);

          // ✅ Save reorder to DB
          reordered.forEach((c, index) => {
            fetch(`${API_URL}/${c.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                status: c.status,
                priority: index + 1,
              }),
            });
          });

          return {
            clients: {
              ...prevState.clients,
              [targetSwimlane]: reordered,
            },
          };
        }

        // Moving to different swimlane
        const updatedCard = {
          ...card,
          status: this.getStatusFromSwimlane(targetSwimlane),
          priority: newPriority,
        };

        const newSourceClients = sourceClients.filter(
          (c) => String(c.id) !== String(cardId),
        );
        const newTargetClients = [...targetClients];
        newTargetClients.splice(droppedIndex, 0, updatedCard);

        // Save new swimlane + priority to DB
        fetch(`${API_URL}/${cardId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: this.getStatusFromSwimlane(targetSwimlane),
            priority: newPriority,
          }),
        }).catch((err) => console.error("Failed to update client:", err));

        return {
          clients: {
            ...prevState.clients,
            [sourceSwimlane]: newSourceClients,
            [targetSwimlane]: newTargetClients,
          },
        };
      });
    });
  }

  // Maps DOM ref → state key
  getSwimlaneStatus(domEl) {
    const { backlog, inProgress, complete } = this.swimlanes;
    if (domEl === backlog.current) return "backlog";
    if (domEl === inProgress.current) return "inProgress";
    if (domEl === complete.current) return "complete";
    return null;
  }

  // Maps state key → status string
  getStatusFromSwimlane(swimlane) {
    const map = {
      backlog: "backlog",
      inProgress: "in-progress",
      complete: "complete",
    };
    return map[swimlane];
  }

  renderSwimlane(name, clients, ref) {
    return <Swimlane name={name} clients={clients} dragulaRef={ref} />;
  }

  render() {
    return (
      <div className="Board">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-4">
              {this.renderSwimlane(
                "Backlog",
                this.state.clients.backlog,
                this.swimlanes.backlog,
              )}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane(
                "In Progress",
                this.state.clients.inProgress,
                this.swimlanes.inProgress,
              )}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane(
                "Complete",
                this.state.clients.complete,
                this.swimlanes.complete,
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
