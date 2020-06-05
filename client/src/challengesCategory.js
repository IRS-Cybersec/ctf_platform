import React from 'react';
import { Layout, Card, List, message, Modal, Tag, Input, Button, Tabs, Avatar, Form, notification } from 'antd';
import {
  LoadingOutlined,
  UnlockOutlined,
  ProfileOutlined,
  FlagOutlined,
  SmileOutlined
} from '@ant-design/icons';
import './App.css';
import { Link } from 'react-router-dom';

const { Meta } = Card;
const { TabPane } = Tabs;



class ChallengesCategory extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      challenges: [],
      challengeModal: false,
      currentChallenge: "",
      viewingChallengeDetails: {
        name: "",
        category: this.props.category,
        description: "",
        points: 0,
        author: "",
        created: "",
        solves: [],
        max_attempts: 0,
        tags: [],
        hints: [],
      },
      challengeTags: [],
      loadingChallenge: false,
      currentChallengeSolved: false

    };
  }

  componentDidMount() {
    const startup = async () => {
      await this.fetchCategories()
    }

    startup()
  }

  fetchCategories() {

    fetch("https://api.irscybersec.tk/v1/challenge/list/" + encodeURIComponent(this.props.category), {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {

      if (data.success === true) {
        this.setState({ challenges: data.challenges })
      }
      else {
        message.error({ content: "Oops. Unknown error" })
      }


    }).catch((error) => {
      message.error({ content: "Oops. There was an issue connecting with the server" });
    })
  }

  loadChallengeDetails(name, solved) {
    this.setState({ currentChallenge: name, loadingChallenge: true, currentChallengeSolved: solved })
    if (solved === true) {
      this.setState({ currentChallengeStatus: "Challenge already solved." })
    }
    else {
      this.setState({ currentChallengeStatus: "Enter the flag (case-sensitive)" })
    }
    document.getElementById(name).style.pointerEvents = "none"
    fetch("https://api.irscybersec.tk/v1/challenge/show/" + encodeURIComponent(name), {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      console.log(data)

      if (data.success === true) {

        if (data.chall.max_attempts === 0) {
          data.chall.max_attempts = "Unlimited"
        }
        const tag = data.chall.tags
        const renderTags = []
  
        for (var x = 0; x < tag.length; x++) {
          renderTags.push(
            <Tag color="#1765ad">
              {tag[x]}
            </Tag>
          )
        }

        this.setState({ viewingChallengeDetails: data.chall, challengeModal: true, challengeTags: renderTags, loadingChallenge: false })

      }
      else {
        message.error({ content: "Oops. Unknown error" })
      }
      document.getElementById(name).style.pointerEvents = "auto"


    }).catch((error) => {
      console.log(error)
      message.error({ content: "Oops. There was an issue connecting with the server" });
    })
  }

  submitFlag(values) {

    fetch("https://api.irscybersec.tk/v1/challenge/submit", {
      method: 'post',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
      body: JSON.stringify({
        "flag": values.flag,
        "chall": this.state.currentChallenge,
      })
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      console.log(data)
      if (data.success === true) {
        if (data.data === "correct") {
          notification["success"]({
            message: 'Challenge Solved! Congratulations!',
            description:
              'Congratulations for solving \"' + this.state.currentChallenge + '\".',
            duration: 0
          });
        }
        else {
          notification["error"]({
            message: 'Oops. Incorrect Flag',
            description:
              'It seems like you submitted an incorrect flag for \"' + this.state.currentChallenge + '\".',
            duration: 0
          });
        }
      }
      else {
        if (data.error === "exceeded") {
          notification["error"]({
            message: 'Oops. Exceeded Maximum Number of Attempts',
            description:
              'It seems like you have execeeded the maximum number of attempts for \"' + this.state.currentChallenge + '\". Contact an admin if you need more tries',
            duration: 0
          });
        }
        else {
          message.error({ content: "Oops. Unknown error" })
        }
      }
    }).catch((error) => {
      message.error({ content: "Oops. There was an issue connecting to the server" });
    })
  }

  render() {
    return (
      <Layout style={{ height: "100%", width: "100%" }}>

        <Modal
          title={null}
          visible={this.state.challengeModal}
          footer={null}
          bodyStyle={{ textAlign: "center" }}
          onCancel={() => { this.setState({ challengeModal: false }) }}
        >
          <Tabs defaultActiveKey="challenge">
            <TabPane
              tab={<span><ProfileOutlined /> Challenge</span>}
              key="challenge"
            >
              <h1 style={{ fontSize: "150%" }}>{this.state.viewingChallengeDetails.name}</h1>
              <div>
                {this.state.challengeTags}
              </div>
              <h2 style={{ color: "#1765ad", marginTop: "2vh", marginBottom: "2vh", fontSize: "200%" }}>{this.state.viewingChallengeDetails.points}</h2>
              <p dangerouslySetInnerHTML={{ __html: this.state.viewingChallengeDetails.description }}></p>
              <div style={{ display: "flex" }}>
                <Form
                  name="submit-flag"
                  className="submit-flag-form"
                  onFinish={this.submitFlag.bind(this)}
                  style={{ display: "flex", justifyContent: "center", width: "100%", marginTop: "2vh" }}
                >
                  <Form.Item
                    name="flag"
                    rules={[{ required: true, message: 'Come on! Flags are definitely not blank.' }]}>
                    <Input disabled={this.state.currentChallengeSolved} style={{ width: "45ch" }} defaultValue="" placeholder={this.state.currentChallengeStatus} />
                  </Form.Item>
                  <Form.Item>
                    <Button disabled={this.state.currentChallengeSolved} type="primary" htmlType="submit" icon={<FlagOutlined />}>Submit</Button>
                  </Form.Item>
                </Form>
              </div>
              <p style={{ textAlign: "end", color: "#d87a16", fontWeight: 500, marginTop: "-1vh" }}>Attempts Remaining: Number/{this.state.viewingChallengeDetails.max_attempts}</p>
            </TabPane>
            <TabPane
              tab={<span><UnlockOutlined /> Solves </span>}
              key="solves"
            >
              <List
                itemLayout="horizontal"
                dataSource={this.state.viewingChallengeDetails.solves}
                locale={{
                  emptyText: (
                    <div>
                      <SmileOutlined style={{ fontSize: "500%" }} />
                      <br />
                      <br />
                      <p style={{ fontSize: "150%" }}>No solves yet. Maybe you can be the first!</p>
                    </div>
                  )
                }}
                renderItem={item => {
                  return (
                    <List.Item key={item}>
                      <List.Item.Meta
                        avatar={<Avatar src="https://www.todayifoundout.com/wp-content/uploads/2017/11/rick-astley.png" />}
                        title={item}
                      />
                    </List.Item>
                  )
                }
                } />
            </TabPane>
          </Tabs>


        </Modal>

        <List
          grid={{ column: 4, gutter: 20 }}
          dataSource={this.state.challenges}
          locale={{
            emptyText: (
              <div className="demo-loading-container" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                <LoadingOutlined style={{ color: "#177ddc", fontSize: "600%", position: "absolute", zIndex: 1 }} />
              </div>
            )
          }}
          renderItem={item => {
            if (!("firstBlood" in item)) {
              item.firstBlood = "No Solves Yet!"
            }


            if (item.solved === false) {
              return (
                <List.Item key={item.name}>
                  <div id={item.name} onClick={() => { this.loadChallengeDetails(item.name, item.solved) }}>
                    <Card
                      hoverable
                      type="inner"
                      bordered={true}
                      bodyStyle={{ backgroundColor: "#262626" }}
                      className="card-design"
                      style={{ overflow: "hidden" }}
                    >
                      <Meta
                        title={
                          <h1 style={{ overflow: "hidden", maxWidth: "30ch", textOverflow: "ellipsis", fontSize: "85%" }}>{item.name}</h1>
                        }
                        description={
                          <div style={{ display: "flex", justifyContent: "center", flexDirection: "column", textAlign: "center" }}>
                            <h1 style={{ fontSize: "185%", color: "#1765ad", fontWeight: 700 }}>{item.points}</h1>
                            <h1 style={{ color: "#d32029" }}><svg t="1591275807515" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2225" width="16" height="16"><path d="M512 0C430.3872 123.8016 153.6 458.4448 153.6 656.384 153.6 859.4432 314.0608 1024 512 1024S870.4 859.4432 870.4 656.384C870.4 458.4448 593.6128 123.8016 512 0zM224.3584 656.384c0-22.4256 17.2032-40.448 38.4-40.448s38.4 18.0224 38.4 40.448c0 59.392 23.4496 113.0496 61.3376 151.8592 38.0928 39.1168 90.9312 63.2832 149.504 63.2832 21.1968 0 38.4 18.1248 38.4 40.448A39.424 39.424 0 0 1 512 952.32a282.624 282.624 0 0 1-202.9568-86.4256A299.52 299.52 0 0 1 224.3584 656.384z" p-id="2226" fill="#d81e06"></path></svg> {item.firstBlood}</h1>
                            {this.state.loadingChallenge && this.state.currentChallenge === item.name && (
                              <div style={{ width: "100%", height: "100%", backgroundColor: "red", zIndex: 1 }}>
                                <LoadingOutlined style={{ color: "#177ddc", fontSize: "500%", position: "absolute", zIndex: 1, left: "40%", top: "30%" }} />
                              </div>
                            )}
                          </div>


                        }
                      />
                    </Card> {/*Pass entire datasource as prop*/}
                  </div>
                </List.Item>
              )
            }
            else {
              return (
                <List.Item key={item.name}>
                  <div id={item.name} onClick={() => { this.loadChallengeDetails(item.name, item.solved) }}>
                    <Card
                      hoverable
                      type="inner"
                      bordered={true}
                      bodyStyle={{ backgroundColor: "#306317" }}
                      className="card-design"
                      style={{ overflow: "hidden", opacity: 0.8 }}
                    >
                      <Meta
                        title={
                          <h1 style={{ overflow: "hidden", maxWidth: "30ch", textOverflow: "ellipsis", fontSize: "85%" }}>{item.name}</h1>
                        }
                        description={
                          <div style={{ display: "flex", justifyContent: "center", flexDirection: "column", textAlign: "center" }}>
                            <h1 style={{ fontSize: "185%", color: "#1765ad", fontWeight: 700 }}>{item.points}</h1>
                            <h1 style={{ color: "#d32029" }}><svg t="1591275807515" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2225" width="16" height="16"><path d="M512 0C430.3872 123.8016 153.6 458.4448 153.6 656.384 153.6 859.4432 314.0608 1024 512 1024S870.4 859.4432 870.4 656.384C870.4 458.4448 593.6128 123.8016 512 0zM224.3584 656.384c0-22.4256 17.2032-40.448 38.4-40.448s38.4 18.0224 38.4 40.448c0 59.392 23.4496 113.0496 61.3376 151.8592 38.0928 39.1168 90.9312 63.2832 149.504 63.2832 21.1968 0 38.4 18.1248 38.4 40.448A39.424 39.424 0 0 1 512 952.32a282.624 282.624 0 0 1-202.9568-86.4256A299.52 299.52 0 0 1 224.3584 656.384z" p-id="2226" fill="#d81e06"></path></svg> {item.firstBlood}</h1>
                            {this.state.loadingChallenge && this.state.currentChallenge === item.name && (
                              <div style={{ width: "100%", height: "100%", backgroundColor: "red", zIndex: 1 }}>
                                <LoadingOutlined style={{ color: "#177ddc", fontSize: "500%", position: "absolute", zIndex: 1, left: "40%", top: "30%" }} />
                              </div>
                            )}
                          </div>


                        }
                      />
                    </Card> {/*Pass entire datasource as prop*/}
                  </div>
                </List.Item>
              )
            }
          }
          }
        />
      </Layout>

    );
  }
}

export default ChallengesCategory;
