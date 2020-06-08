import React from 'react';
import { Layout, Card, List, Progress, message, Button } from 'antd';
import {
  LoadingOutlined,
  LeftCircleTwoTone
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
      currentCategory: "",
    };
  }

  componentDidMount() {
    const startup = async () => {
      await this.fetchCategories()
    }
    startup()

    const category = this.props.match.params.category;
    if (typeof category !== "undefined") {
      this.setState({ challengeCategory: true, currentCategory: decodeURIComponent(category) })
    }
  }

  parseCategories(data) {
    for (let x = 0; x < data.data.length; x++) {
      let currentCategory = data.data[x].challenges
      let solvedStats = {
        challenges: currentCategory.length,
        solved: 0,
        percentage: 0
      }

      for (let y = 0; y < currentCategory.length; y++) {
        if (currentCategory[y].solved === true) {
          solvedStats.solved += 1
        }
      }

      solvedStats.percentage = Math.round((solvedStats.solved / solvedStats.challenges) * 100)
      data.data[x].challenges = solvedStats
    }

    return data;
  
  }

  fetchCategories() {
    fetch("https://api.irscybersec.tk/v1/challenge/list", {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      console.log(data)

      if (data.success === true) {

        const parseData = async () => {
          const newData = await this.parseCategories(data) 
          console.log(newData.data)
          this.setState({ categories: newData.data })
        }
        parseData()
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

      <Layout style={{ height: "100%", width: "100%", overflowY: "scroll", overflowX: "hidden" }}>
        <div id="Header" style={{ positon: "relative", width: "100%", height: "40vh", textAlign: "center", borderStyle: "solid", borderWidth: "0px 0px 3px 0px", borderColor: "#1890ff", marginBottom: "5vh", lineHeight: "1.1" }}>
          <img alt="Banner" style={{ width: "100%", height: "100%", opacity: 0.6 }} src={require("./assets/challenges_bg.jpg")} />

          {!this.state.currentCategory && (
            <h1 style={{
              color: "white",
              position: "relative",
              bottom: "60%",
              fontSize: "250%",
              letterSpacing: ".3rem",
              backgroundColor: "#164c7e",
              paddingTop: "10px",
              paddingBottom: "10px",
              fontWeight: 300
            }}> CHALLENGES
            </h1>
          )}

          {this.state.currentCategory && (
            <h1 style={{
              color: "white",
              position: "relative",
              bottom: "70%",
              fontSize: "140%",
              letterSpacing: ".3rem",
              backgroundColor: "#164c7e",
              paddingTop: "10px",
              fontWeight: 300
            }}> CHALLENGES <p style={{ fontSize: "210%", letterSpacing: "normal", paddingBottom: "10px", fontWeight: 400 }}>{this.state.currentCategory}</p></h1>
            
          )}
          {this.state.currentCategory && (
            <Button type="primary" style={{ display: "block", position: "relative", bottom: "75%", left: "1%" }} icon={<LeftCircleTwoTone twoToneColor="#d89614" />} onClick={() => { this.props.history.push("/Challenges"); this.setState({ challengeCategory: false, currentCategory: "" }) }} size="large">Back</Button>
          )}
        </div>



        {!this.state.challengeCategory && (
          <List
            grid={{ column: 4, gutter: 20 }}
            dataSource={this.state.categories}
            locale={{
              emptyText: (
                <div className="demo-loading-container" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: "10vh" }}>
                  <LoadingOutlined style={{color: "#177ddc", fontSize: "600%", position: "absolute", zIndex: 1}}/>
                </div>
              )
            }}
            renderItem={item => {
              i += 1
              if (i > 2) {
                i = 0

              }

              return (
                <List.Item key={item._id}>
                  <Link to={"Challenges/" + item._id}>
                    <div onClick={() => { this.setState({ challengeCategory: true, currentCategory: item._id, currentSolvedStatus: item.challenges }) }}>
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
                              <h1 style={{ color: "white", fontSize: "100%", width: "15vw", textOverflow: "ellipsis", overflow: "hidden" }}>{item._id}</h1>
                              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
                                <h2 style={{ fontSize: "1vw", marginLeft: "1vw" }}>{item.challenges.solved}/{item.challenges.challenges}</h2>
                                <Progress type="circle" percent={item.challenges.percentage} width="3.2vw" strokeColor={{
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
          <ChallengesCategory category={this.state.currentCategory} challengeFetchCategory={this.fetchCategories.bind(this)}></ChallengesCategory>
        )}
      </Layout>

    );
  }
}

export default challenges;
