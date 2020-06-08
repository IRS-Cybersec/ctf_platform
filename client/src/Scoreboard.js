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


class Scoreboard extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  render() {
    return (

      <Layout style={{ height: "100%", width: "100%" }}>
       
      </Layout>
    );
  }
}

export default Scoreboard;
