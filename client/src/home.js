import React from 'react';
import { Layout, Divider, List, Card, message } from 'antd';
import {
  FileUnknownTwoTone,
  NotificationTwoTone
} from '@ant-design/icons';
import MarkdownRenderer from './MarkdownRenderer.js';
import { Ellipsis } from 'react-spinners-css';
import { orderBy } from "lodash";
import './App.min.css';




class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      announcements: [],
      updatingIndicator: false
    };
  }

  componentDidMount = async () => {
    this.setState({ updatingIndicator: true })
    let announcementCache = JSON.parse(localStorage.getItem("announcements"))
    let announcementVersion = -1
    if (announcementCache !== null) {
      announcementVersion = announcementCache.version
      this.setState({ announcements: announcementCache.data })
    }
    await fetch(window.ipAddress + "/v1/announcements/list/" + announcementVersion.toString(), {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      if (data.success === true) {
        if (data.data !== "UpToDate") {
          const orderedData = orderBy(data.data, ["timestamp"], ["desc"])
          localStorage.setItem("announcements", JSON.stringify({ data: orderedData, version: data.version }))
          this.setState({ announcements: orderedData })
        }
      }
      else {
        message.error("Oops, unknown error")
      }
    }).catch((error) => {
      message.error("Oops, there was an issue connecting to the server");
    })
    announcementCache = JSON.parse(localStorage.getItem("announcements"))
    this.setState({ updatingIndicator: false })


  }

  render() {
    return (

      <Layout className="layout-style">
        <h2>Welcome to the Sieberrsec Training Platform!</h2>
        <h3>This platform is in early alpha. Do report any bugs you find :D!</h3>
        <Divider />
        <div style={{ display: "flex", alignItems: "center" }}>
          <h1 style={{ fontSize: "150%", marginRight: "1ch" }}>Announcements <NotificationTwoTone /></h1> {this.state.updatingIndicator && (<div style={{ display: "flex", alignItems: "center" }}><Ellipsis color="#177ddc" size={50} /> <h4> Checking for updates...</h4></div>)}
        </div>
        <List
          grid={{ gutter: 0, column: 1 }}
          dataSource={this.state.announcements}
          locale={{
            emptyText: (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                <h1 style={{ fontSize: "200%" }}>There are no announcements.</h1>
              </div>
            )
          }}
          renderItem={item => {
            return (
              <List.Item key={item.title}>
                <Card

                  hoverable
                  type="inner"
                  bordered={true}
                  bodyStyle={{ backgroundColor: "#262626" }}
                  style={{ overflow: "hidden" }}
                >
                  <h1>{item.title}</h1>
                  <Divider />
                  <MarkdownRenderer>{item.content}</MarkdownRenderer>
                  <span style={{ float: "right" }}>Posted on <i>{new Date(item.timestamp).toLocaleString("en-US", { timeZone: "Asia/Singapore" })}</i></span>
                </Card>

              </List.Item>
            )
          }}

        >

        </List>

      </Layout>


    );
  }
}

export default Home;
