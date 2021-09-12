import React from 'react';
import { Button, Layout, message, Tabs, Card, Upload, Divider } from 'antd';
import {
  UserOutlined,
  AppstoreOutlined,
  BarsOutlined,
  NotificationOutlined,
  DownloadOutlined,
  UploadOutlined
} from '@ant-design/icons';
import AdminUsers from "./adminUsers.js";
import AdminChallenges from "./adminChallenges.js";
import AdminSubmissions from "./adminSubmissions.js";
import AdminManageAnnouncements from "./adminManageAnnouncements.js";

const { TabPane } = Tabs;
const { Dragger } = Upload;

class Admin extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      key: "",
      backupLoading: false,
      fileList: [],
      noFile: true,
      loadingUpload: false
    }
  }
  componentDidMount = () => {
    const tabPane = this.props.match.params.tabPane;
    if (typeof tabPane !== "undefined") {
      this.setState({ key: decodeURIComponent(tabPane) })
    }
  }

  downloadBackup = async () => {
    this.setState({ backupLoading: true })
    await fetch(window.ipAddress + "/v1/backup", {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      //console.log(data)
      if (data.success === true) {
        const downloadData = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data.data))
        const downloadAnchorNode = document.createElement('a');
        const date = new Date()
        downloadAnchorNode.setAttribute("href", downloadData);
        downloadAnchorNode.setAttribute("download", date.toISOString().slice(0, -15) + "-Backup.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();

        message.success("Downloaded backup successfully")
      }

    }).catch((error) => {
      console.log(error)
      message.error({ content: "Oops. Issue connecting with the server or client error, please check console and report the error. " });
    })
    this.setState({ backupLoading: false })
  }

  uploadBackup = async () => {
    this.setState({loadingUpload: true})
    const jsonData = await this.state.fileList[0].originFileObj.text()
    try {
      JSON.parse(jsonData)
      await fetch(window.ipAddress + "/v1/uploadBackup", {
        method: 'post',
        headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
        body: jsonData
      }).then((results) => {
        return results.json(); //return data in JSON (since its JSON data)
      }).then((data) => {
        //console.log(data)
        if (data.success === true) {
          message.success("Uploaded backup successfully")
        }
  
      }).catch((error) => {
        console.log(error)
        message.error({ content: "Oops. Issue connecting with the server or client error, please check console and report the error. " });
      })
    }
    catch (e) {
      message.error("Invalid json file.")
    }
    this.setState({loadingUpload: false, fileList: []})
  }

  render() {
    return (

      <Layout className="layout-style">
        <Tabs activeKey={this.state.key} onTabClick={async (key) => {
          await this.props.history.push("/Admin/" + key)
          if (this.props.location.pathname === "/Admin/" + key) this.setState({ key: key })

        }} style={{ overflowY: "auto", overflowX: "auto" }}>
          <TabPane
            tab={<span> Home </span>}
            key=""
          >
            <h1>Welcome to Sieberrsec CTF Platform's admin panel.</h1>
            <h1>Click on any of the tabs above to manage different parts of the portal.</h1>

            <div className="settings-responsive" style={{ display: "flex", justifyContent: "space-around" }}>
              <Card>
                <Button type='primary' onClick={this.downloadBackup} loading={this.state.backupLoading}><DownloadOutlined /> Download Backup</Button>
                <p>Download all the data stored in the platform's database. Data can be uploaded onto a different platform/a later date to restore all the data</p>
              </Card>

              <Divider type="vertical" style={{ height: "inherit" }} />

              <Card>
                <div style={{ width: "30ch" }}>
                  <Dragger
                    fileList={this.state.fileList}
                    disabled={this.state.loadingUpload}
                    accept=".json"
                    maxCount={1}
                    onChange={(file) => {
                      if (file.fileList.length > 0) this.setState({ noFile: false })
                      else this.setState({ noFile: true })
                      this.setState({ fileList: file.fileList })
                    }}
                    beforeUpload={(file) => {
                      return false
                    }}>
                    <p>Drag and drop backup .json file</p>
                  </Dragger>
                  <Button type="primary" icon={<UploadOutlined />} style={{ marginTop: "3ch" }} disabled={this.state.noFile} loading={this.state.loadingUpload} onClick={this.uploadBackup}>Upload Backup</Button>
                </div>
                <p>Restore and upload data stored in a backup json file. <span style={{ color: "#d32029" }}><b>Warning: This <u>WILL OVERRIDE ALL EXISTING DATA</u> stored in this platform</b> (including the current account used to upload the backup). Please re-login after restoration is completed.</span></p>
              </Card>
            </div>
          </TabPane>
          <TabPane
            tab={<span><NotificationOutlined />Announcements</span>}
            key="Announcements"
          >
            <AdminManageAnnouncements />
          </TabPane>
          <TabPane
            tab={<span><UserOutlined />Users</span>}
            key="Users"
          >
            <AdminUsers></AdminUsers>
          </TabPane>
          <TabPane
            tab={<span><AppstoreOutlined />Challenges</span>}
            key="Challenges"
          >
            <AdminChallenges history={this.props.history} location={this.props.location}></AdminChallenges>
          </TabPane>
          <TabPane
            tab={<span><BarsOutlined />Submissions</span>}
            key="Submissions"
          >
            <AdminSubmissions></AdminSubmissions>
          </TabPane>
        </Tabs>



      </Layout>
    );
  }
}

export default Admin;
