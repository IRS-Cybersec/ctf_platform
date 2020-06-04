import React from 'react';
import { Layout, Card, List, Progress, message } from 'antd';
import {
  LoadingOutlined,
} from '@ant-design/icons';
import './App.css';
import { Link } from 'react-router-dom';
import ChallengesCategory from "./challengesCategory.js";

const { Meta } = Card;

const categoryImages = [require("./assets/catPhoto1.jpg"), require("./assets/catPhoto2.jpg"), require("./assets/catPhoto3.jpg")]



  var i = -1

class challenges extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      categories: [],
      challengeCategory: false,
      currentCategory: ""
    };
  }

  componentDidMount() {
    const startup = async () => {
      await this.fetchCategories()
    }
    startup()

    const category = this.props.match.params.category;
    if (typeof category !== "undefined") {
      this.setState({challengeCategory: true, currentCategory: category})
    }
  }

  fetchCategories() {
    fetch("https://api.irscybersec.tk/v1/challenge/list_categories", {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      console.log(data)
      if (data.success === true) {
        this.setState({ categories: data.categories })
      }
      else {
        message.error({ content: "Oops. Unknown error" })
      }


    }).catch((error) => {
      message.error({ content: "Oops. There was an issue connecting with the server" });
    })
  }

  render() {
    return (

      <Layout style={{ height: "100%", width: "100%" }}>
        <div id="Header" style={{ positon: "relative", width: "100%", height: "40vh", textAlign: "center", borderStyle: "solid", borderWidth: "0px 0px 3px 0px", borderColor: "#1890ff", marginBottom: "5vh" }}>
          <img alt="Banner" style={{ width: "100%", height: "100%", opacity: 0.6 }} src={require("./assets/challenges_bg.jpg")} />
          <h1 style={{
            color: "white",
            position: "relative",
            bottom: "60%",
            fontSize: "3vw",
            backgroundColor: "#164c7e",
          }}> Challenges</h1>
        </div>

        {!this.state.challengeCategory && (
        <List
          grid={{ column: 4, gutter: 20 }}
          dataSource={this.state.categories}
          locale={{
            emptyText: (
              <div className="demo-loading-container" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", fontSize: "3vw" }}>
                <LoadingOutlined />
              </div>
            )
          }}
          renderItem={item => {
            i += 1
            if (i > 2) {
              i = 0
              
            }
            return (
              <List.Item key={item}>
                <Link to={"Challenges/" + item}>
                  <div onClick={() => {this.setState({challengeCategory: true, currentCategory: item})}}>
                    <Card
                      hoverable
                      type="inner"
                      bordered={true}
                      bodyStyle={{ backgroundColor: "#262626" }}
                      className="card-design"
                      style={{ overflow: "hidden" }}
                      cover={<img style={{ height: "20vh", width: "30vw", overflow: "hidden" }} alt="Category Card" src={categoryImages[i]} />}
                    >
                      <Meta
                        title={
                          <div id="Title" style={{ display: "flex", color: "#f5f5f5", flexDirection: "row", alignContent: "center", alignItems: "center" }}>
                            <h1 style={{ color: "white", fontSize: "100%", width: "15vw", textOverflow: "ellipsis", overflow: "hidden" }}>{item}</h1>
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
                              <h2 style={{ fontSize: "1vw", marginLeft: "1vw" }}>20/25</h2>
                              <Progress type="circle" percent={75} width="3.2vw" strokeColor={{
                                '0%': '#177ddc',
                                '100%': '#49aa19',
                              }} style={{ marginLeft: "1vw", fontSize: "1vw" }} />
                            </div>
                          </div>
                        }
                      />
                    </Card> {/*Pass entire datasource as prop*/}
                  </div>
                </Link>
              </ List.Item>
            )
          }
          }
        />
        )}

        {this.state.challengeCategory && (
          <ChallengesCategory category={this.state.currentCategory}></ChallengesCategory>
        )}
      </Layout>

    );
  }
}

export default challenges;
