import React from 'react';
import { Layout, Menu, Breadcrumb } from 'antd';
import {
  FlagTwoTone,
  HomeTwoTone,
  FundTwoTone,
  NotificationTwoTone,
  SmileTwoTone,
} from '@ant-design/icons';
import './App.css';
import { NavLink, Switch, Route, withRouter, useHistory, useLocation } from 'react-router-dom';

const { Header, Content, Footer, Sider } = Layout;


class Oops extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  render() {
    return (

      <Layout style={{ height: "100%", width: "100%", textAlign: "center" }}>
          <h2>Welcome to Limbo.</h2> 
          <p>You probably ended up here because you tried to access a page you did not have access to (or you visited this page manually). </p>
          <p>If you believe this is an error, please contact an admin.</p>
      </Layout>
    );
  }
}

export default Oops;
