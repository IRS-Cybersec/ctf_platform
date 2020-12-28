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
      <animated.div style={{ ...this.props.transition, height: "100vh", overflowY: "auto", backgroundColor: "rgba(0, 0, 0, 0.7)", border: "5px solid transparent", borderRadius: "20px" }}>
        <Layout className="pageSwitch" style={{ margin: "20px", backgroundColor: "rgba(0, 0, 0, 0)" }}>
          <p>Announcements <NotificationTwoTone /> </p>
        </Layout>
      </animated.div>
    );
  }
}

export default Announcements;
