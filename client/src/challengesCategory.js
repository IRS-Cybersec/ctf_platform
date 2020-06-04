import React from 'react';
import { Layout, Card, List, Progress, message } from 'antd';
import {
  LoadingOutlined,
} from '@ant-design/icons';
import './App.css';
import { Link } from 'react-router-dom';

const { Meta } = Card;

class ChallengesCategory extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      challenges: []
    };
  }

  componentDidMount() {
    const startup = async () => {
      await this.fetchCategories()
    }
  }

  fetchCategories() {
    fetch("https://api.irscybersec.tk/v1/challenge/list/" + this.props.category, {
      method: 'get',
      headers: { 'Content-Type': 'application/json', "Authorization": localStorage.getItem("IRSCTF-token") },
    }).then((results) => {
      return results.json(); //return data in JSON (since its JSON data)
    }).then((data) => {
      console.log(data)
      if (data.success === true) {
        this.setState({ categories: data.challenges })
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
            return (
              <List.Item key={item}>
                <Link to={"Challenges/" + item}>
                  <div onClick={console.log("Card click")}>
                    <Card
                      hoverable
                      type="inner"
                      bordered={true}
                      bodyStyle={{ backgroundColor: "#262626" }}
                      className="card-design"
                      style={{ overflow: "hidden" }}
                      cover={<img style={{ height: "20vh", width: "30vw", overflow: "hidden" }} alt="Category Card" src={""} />}
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
      </Layout>

    );
  }
}

export default ChallengesCategory;
