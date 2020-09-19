import React from 'react';
import { Layout } from 'antd';
import {
  NotificationTwoTone,
} from '@ant-design/icons';
import './App.css';
import { animated } from 'react-spring/renderprops';


class Announcements extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  render() {
    return (
      <animated.div style={{ ...this.props.transition, position: "absolute" }}>
        <Layout className="pageSwitch" style={{ height: "100%", width: "100%" }}>
          <p>Announcements <NotificationTwoTone /> </p>
        </Layout>
      </animated.div>
    );
  }
}

export default Announcements;
