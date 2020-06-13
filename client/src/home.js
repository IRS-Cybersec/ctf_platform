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

      <Layout className="pageTransition" style={{ height: "100%", width: "100%", textAlign: "center", overflowY: "scroll", overflowX: "hidden" }}>
        <h2>Welcome to the IRS Cybersec CTF Platform!</h2>
        <h3>This platform is in really early alpha. Do report any bugs you find :D!</h3>
        <br />
        <h4><u><b>General Rules for Sieberrsec CTF (13/6/20) 3-10pm:</b></u></h4>
        <p>
          - Do not attack the server infrastructrure in anyway, if you found an exploit, please report it immediately. <br />
          - Do not corrupt any challenges if you found a way to do so (that's just mean!)<br />
          - No sharing of flags/solutions until the CTF ends. Try to not spoil this experience for anyone :D<br />
          - If you need further clarification for any challenges, please contact the challenge author (whose name can be found in the challenge description)<br />
          - Have fun, enjoy yourselves and we hope you learnt something :)!<br />
          ~ <i>Sincerely, Sieberrsec 18/19 &amp; 19/20 &amp; 20/21</i>
        </p>
        <br />
        <h4><u><b>Prizes</b></u></h4>
        <p>
          - 1st place - $6 Digital Gift Card (anything close to that value) <br />
          - 2nd place - Random $2+ worth of stationary, J2s will go there and pick a random 1<br />
          - 3rd Place - Random $1+ worth of stationary, J2s will go there and pick a random 1<br />
          - Special Award: Best Challenge Award (by @willi123yao ) - For the best J1 challenge submitted, voted by J2s ($10 worth) [1st - $6, 2nd - $4]<br />
        </p>

        <div style={{ textAlign: "start" }}>
          <h3>Changelog:</h3>
          <p><u>Version 0.12.6 (11/6/2020)</u></p>
          <ul>
            <li>Solve counts for each challenge</li>
            <li>Even more page transitions</li>
            <li>Fix scoreboard to take into account time of submission</li>
          </ul>
          <br />
          <p><u>Version 0.12.5 (10/6/2020)</u></p>
          <ul>
            <li>Fixed Scoreboard</li>
            <li>Page transitions</li>
            <li>New admin panel tab - Submissions</li>
            <li>Added sieberrsec favicon</li>
            <li>Fixed Free Hints text</li>
          </ul>
        </div>
      </Layout>
    );
  }
}

export default home;
