import React from 'react';
import { Layout } from 'antd';
import {
  FileUnknownOutlined,
} from '@ant-design/icons';
import './App.css';
import { animated } from 'react-spring/renderprops';


class Oops extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  render() {
    return (
      <animated.div style={{ ...this.props.transition, height: "95vh", overflowY: "auto", backgroundColor: "rgba(0, 0, 0, 0.7)", border: "5px solid transparent", borderRadius: "20px" }}>
        <Layout style={{ margin: "20px", backgroundColor: "rgba(0, 0, 0, 0)", textAlign: "center" }}>
          <FileUnknownOutlined style={{ fontSize: "400%", marginBottom: "2vh" }} />
          <h2>Welcome to Limbo.</h2>
          <h3>There is nothing here. Really.</h3>
          <p>You probably ended up here because you tried to access a page you did not have access to or tried to access a page that does not exist.</p>
          <p>Click on any of the links on the menu to return to society.</p>
          <p>If you believe this is an error, please contact an admin.</p>
        </Layout>
      </animated.div>
    );
  }
}

export default Oops;
