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


class home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  render() {
    return (

      <Layout style={{ height: "100%", width: "100%", textAlign: "center" }}>
          <h2>Welcome to the IRS Cybersec CTF Platform!</h2>
          <h3>This platform is in really early alpha. Do report any bugs you find :D!</h3>
          <p>
            Version 0.12 (10/6/2020)
          </p>
      </Layout>
    );
  }
}

export default home;
