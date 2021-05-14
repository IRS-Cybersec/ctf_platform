import React from 'react';
import { Card, List, Collapse } from 'antd';
import {
  FileUnknownTwoTone,
  LoadingOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import './App.css';

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
      <Collapse bordered={false} defaultActiveKey={[Object.keys(this.props.tag)[0]]}>
        {
          Object.entries(this.props.tag).map((currentCat, index) => {
            const key = currentCat[0]
            const value = currentCat[1]
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


                    if (item.solved === false) {
                      return (
                        <List.Item key={item.name}>
                          <div id={item.name} onClick={() => { this.props.loadChallengeDetails(item.name, item.solved);  }}>
                            <Card
                              hoverable
                              type="inner"
                              bordered={true}
                              bodyStyle={{ backgroundColor: "#262626" }}
                              className="card-design"
                              style={{ overflow: "hidden" }}
                            >
                              <Meta
                                description={
                                  <div style={{ display: "flex", justifyItems: "center", flexDirection: "column", textAlign: "center", alignItems: "center" }}>
                                    <h1 style={{ textOverflow: "ellipsis", width: "13vw", fontSize: "2.3ch", overflow: "hidden", whiteSpace: "nowrap" }}>{item.name}</h1>
                                    <h1 style={{ fontSize: "185%", color: "#1765ad", fontWeight: 700 }}>{item.points}</h1>
                                    <h1 style={{ color: "#d32029" }}><svg t="1591275807515" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2225" width="16" height="16"><path d="M512 0C430.3872 123.8016 153.6 458.4448 153.6 656.384 153.6 859.4432 314.0608 1024 512 1024S870.4 859.4432 870.4 656.384C870.4 458.4448 593.6128 123.8016 512 0zM224.3584 656.384c0-22.4256 17.2032-40.448 38.4-40.448s38.4 18.0224 38.4 40.448c0 59.392 23.4496 113.0496 61.3376 151.8592 38.0928 39.1168 90.9312 63.2832 149.504 63.2832 21.1968 0 38.4 18.1248 38.4 40.448A39.424 39.424 0 0 1 512 952.32a282.624 282.624 0 0 1-202.9568-86.4256A299.52 299.52 0 0 1 224.3584 656.384z" p-id="2226" fill="#d81e06"></path></svg> {item.firstBlood}</h1>
                                    {this.props.loadingChallenge && this.props.currentChallenge === item.name && (
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
                        <List.Item key={item.name}>
                          <div id={item.name} onClick={() => { this.props.loadChallengeDetails(item.name, item.solved) }}>
                            <Card
                              hoverable
                              type="inner"
                              bordered={true}
                              bodyStyle={{ backgroundColor: "#3c8618" }}
                              className="card-design"
                              style={{ overflow: "hidden" }}
                            >
                              <Meta
                                description={
                                  <div style={{ display: "flex", justifyItems: "center", flexDirection: "column", textAlign: "center", alignItems: "center" }}>
                                    <h1 style={{ textOverflow: "ellipsis", width: "13vw", fontSize: "2.3ch", overflow: "hidden", whiteSpace: "nowrap" }}>{item.name}</h1>
                                    <h1 style={{ fontSize: "185%", color: "#1765ad", fontWeight: 700 }}>{item.points}</h1>
                                    <h1 style={{ color: "#d32029" }}><svg t="1591275807515" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2225" width="16" height="16"><path d="M512 0C430.3872 123.8016 153.6 458.4448 153.6 656.384 153.6 859.4432 314.0608 1024 512 1024S870.4 859.4432 870.4 656.384C870.4 458.4448 593.6128 123.8016 512 0zM224.3584 656.384c0-22.4256 17.2032-40.448 38.4-40.448s38.4 18.0224 38.4 40.448c0 59.392 23.4496 113.0496 61.3376 151.8592 38.0928 39.1168 90.9312 63.2832 149.504 63.2832 21.1968 0 38.4 18.1248 38.4 40.448A39.424 39.424 0 0 1 512 952.32a282.624 282.624 0 0 1-202.9568-86.4256A299.52 299.52 0 0 1 224.3584 656.384z" p-id="2226" fill="#d81e06"></path></svg> {item.firstBlood}</h1>
                                    {this.props.loadingChallenge && this.props.currentChallenge === item.name && (
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
