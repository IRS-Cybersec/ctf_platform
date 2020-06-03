import React from 'react';
import { Layout, Card, List, Progress } from 'antd';
import {
  LoadingOutlined,
} from '@ant-design/icons';
import './App.css';
import { Link } from 'react-router-dom';

const { Meta } = Card;

const categoryImages = {
  "Forensics": "https://redpiranha.net/sites/default/files/revslider/image/digital_forensics_slide_1.jpg",
  "Pwn": "https://redpiranha.net/sites/default/files/revslider/image/digital_forensics_slide_1.jpg",
  "RE": "https://redpiranha.net/sites/default/files/revslider/image/digital_forensics_slide_1.jpg",
  "Web": "https://redpiranha.net/sites/default/files/revslider/image/digital_forensics_slide_1.jpg",
  "Yeetqiodhiuwqhdi uqwhdihqwfbwsfiiqwfhqf": "https://redpiranha.net/sites/default/files/revslider/image/digital_forensics_slide_1.jpg",

}

const Categories = ["Forensics", "Pwn", "RE", "Web", "Forensics", "Forensics", "Forensics", "Forensics", "Forensics", "Yeetqiodhiuwqhdi uqwhdihqwfbwsfiiqwfhqf"]


class challenges extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  render() {
    return (

      <Layout style={{ height: "100%", width: "100%" }}>
        <div id="Header" style={{ positon: "relative", width: "100%", height: "40vh", textAlign: "center", borderStyle: "solid", borderWidth: "0px 0px 3px 0px", borderColor: "#1890ff", marginBottom: "5vh" }}>
          <img alt="Banner" style={{ width: "100%", height: "100%", filter: "blur(2px)", opacity: 0.6 }} src={require("./assets/challenges_bg.jpg")} />
          <h1 style={{
            color: "white",
            position: "relative",
            bottom: "60%",
            fontSize: "3vw",
            backgroundColor: "#164c7e",
          }}> Challenges</h1>
        </div>
        <List
          grid={{ column: 4, gutter: 20 }}
          dataSource={Categories}
          locale={{
            emptyText: (
              <div className="demo-loading-container" style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
                <LoadingOutlined />
              </div>
            )
          }}
          renderItem={item => (
            <List.Item key={item}>
              <Link to={"Category/" + item}>
                <div onClick={console.log("Card click")}>
                  <Card
                    hoverable
                    type="inner"
                    bordered={true}
                    bodyStyle={{ backgroundColor: "#262626" }}
                    className="card-design"
                    style={{ overflow: "hidden" }}
                    cover={<img style={{ height: "20vh", width: "30vw", overflow: "hidden" }} alt="Category Card" src={categoryImages[item]} />}
                  >
                    <Meta
                      title={
                        <div id="Title" style={{ display: "flex", color: "#f5f5f5", flexDirection: "row", alignContent: "center", alignItems: "center" }}>
                          <h1 style={{ color: "white", fontSize: "100%", width: "15vw", textOverflow: "ellipsis", overflow: "hidden" }}>{item}</h1>
                          <div style={{display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column"}}>
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
          )}
        />
      </Layout>

    );
  }
}

export default challenges;
