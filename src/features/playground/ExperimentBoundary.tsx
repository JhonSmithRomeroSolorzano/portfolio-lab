import { Component, type ReactNode } from "react";

type Props = {
  title: string;
  titleId?: string;
  children: ReactNode;
};

/** Optional experiences must never take the résumé or navigation down with them. */
export class ExperimentBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="experiment-placeholder">
        {this.props.titleId && (
          <h3 id={this.props.titleId}>{this.props.title}</h3>
        )}
        <p role="alert">
          {this.props.title} ran into a problem. The résumé and the other
          experiences are still available.
        </p>
        <button
          type="button"
          onClick={(event) => {
            event.currentTarget
              .closest("article")
              ?.focus({ preventScroll: true });
            this.setState({ failed: false });
          }}
        >
          Try {this.props.title} again
        </button>
      </div>
    );
  }
}
