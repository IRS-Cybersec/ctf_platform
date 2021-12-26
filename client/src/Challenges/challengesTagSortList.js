import React from 'react';
import { Card, List, Collapse, Tooltip } from 'antd';
import {
  FileUnknownTwoTone,
  LoadingOutlined,
  EyeInvisibleOutlined,
  LockOutlined,
  CheckOutlined
} from '@ant-design/icons';
const { Meta } = Card;
const { Panel } = Collapse;


class ChallengesTagSortList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeKey: []
    };
  }
  
  render() {
    return (
      <Collapse bordered={false} defaultActiveKey={Object.keys(this.props.tag)}>
        {

          this.props.selectedTags.map((category) => {
            const key = category
            const value = this.props.tag[category]
            return (
              <Panel header={<span style={{ color: "#177ddc", fontSize: "120%", textTransform: "capitalize", textAlign: "center", fontWeight: 700 }}>{key} - <span style={{ color: "#d89614" }}>{"(" + String(value.length) + ")"}</span> </span>} key={key}>
                <List
                  grid={{
                    xs: 1,
                    sm: 2,
                    md: 2,
                    lg: 3,
                    xl: 4,
                    xxl: 5,
                    gutter: 20
                  }}
                  dataSource={value}
                  key={key + "cat"}
                  locale={{
                    emptyText: (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                        <FileUnknownTwoTone style={{ color: "#177ddc", fontSize: "400%", zIndex: 1 }} />
                        <h1 style={{ fontSize: "200%" }}>Oops, no challenges have been created.</h1>
                      </div>
                    )
                  }}
                  renderItem={item => {
                    if (!("firstBlood" in item)) {
                      item.firstBlood = "No Solves Yet!"
                    }

                    if (item.requires && !item.requiresSolved && this.props.permissions < 2) {

                      return (
                        <List.Item key={item._id}>
                          <Tooltip title={<span>Please solve "<b><u>{item.requiresName}</u></b>" to unlock this challenge.</span>}>
                          <div id={item._id}>
                            <Card
                              type="inner"
                              bordered={true}
                              className="card-design"
                            >
                              <Meta
                                description={
                                  <div className="card-design-body" >
                                    <LockOutlined className="disabled-style"/>
                                    <h1 className="card-design-name" >{item.name}</h1>
                                    <h1 className="card-design-points">{item.points}</h1>
                                    <h1 className="card-design-firstblood"><img alt="First Blood" src={require("./../assets/blood.svg").default} /> {item.firstBlood}</h1>
                                    {this.state.loadingChallenge && this.state.currentChallenge === item._id && (
                                      <div style={{ width: "100%", height: "100%", backgroundColor: "red", zIndex: 1 }}>
                                        <LoadingOutlined style={{ color: "#177ddc", fontSize: "500%", position: "absolute", zIndex: 1, left: "40%", top: "30%" }} />
                                      </div>
                                    )}
                                    {item.visibility === false && (
                                      <h1 style={{ color: "#d9d9d9" }}>Hidden Challenge <EyeInvisibleOutlined /></h1>
                                    )}
                                  </div>
      
      
                                }
                              />
                            </Card> {/*Pass entire datasource as prop*/}
                          </div>
                          </Tooltip>
                        </List.Item>
                      )
      
                    }
                    else if (item.solved === false) {
                      return (
                        <List.Item key={item._id}>
                          <div id={item._id} onClick={() => { this.props.loadChallengeDetails(item._id, item.solved); }}>
                            <Card
                              hoverable
                              type="inner"
                              bordered={true}
                              className="card-design hover"
                            >
                              <Meta
                                description={
                                  <div  className="card-design-body">
                                    <h1 className="card-design-name">{item.name}</h1>
                                    <h1 className="card-design-points">{item.points}</h1>
                                    <h1 className="card-design-firstblood"><img alt="First Blood" src={require("./../assets/blood.svg").default} /> {item.firstBlood}</h1>
                                    {this.props.loadingChallenge && this.props.currentChallenge === item._id && (
                                      <div style={{ width: "100%", height: "100%", backgroundColor: "red", zIndex: 1 }}>
                                        <LoadingOutlined style={{ color: "#177ddc", fontSize: "500%", position: "absolute", zIndex: 1, left: "40%", top: "30%" }} />
                                      </div>
                                    )}
                                    {item.visibility === false && (
                                      <h1 style={{ color: "#d9d9d9" }}>Hidden Challenge <EyeInvisibleOutlined /></h1>
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
                        <List.Item key={item._id}>
                          <div id={item._id} onClick={() => { this.props.loadChallengeDetails(item._id, item.solved);}}>
                            <Card
                              hoverable
                              type="inner"
                              bordered={true}
                              className="card-design solved hover"
                            >
                              <Meta
                                description={
                                  <div  className="card-design-body">
                                    <CheckOutlined className="correct-style"/>
                                    <h1 className="card-design-name">{item.name}</h1>
                                    <h1 className="card-design-points">{item.points}</h1>
                                    <h1 className="card-design-firstblood"><img alt="First Blood" src={require("./../assets/blood.svg").default} /> {item.firstBlood}</h1>
                                    {this.props.loadingChallenge && this.props.currentChallenge === item._id && (
                                      <div style={{ width: "100%", height: "100%", backgroundColor: "red", zIndex: 1 }}>
                                        <LoadingOutlined style={{ color: "#177ddc", fontSize: "500%", position: "absolute", zIndex: 1, left: "40%", top: "30%" }} />
                                      </div>
                                    )}
                                    {item.visibility === false && (
                                      <h1 style={{ color: "#d9d9d9" }}>Hidden Challenge <EyeInvisibleOutlined /></h1>
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
              </Panel>
            )
          })

        }
      </Collapse>
    )

  }

}
export default ChallengesTagSortList;
