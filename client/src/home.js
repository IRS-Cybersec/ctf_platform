import React from 'react';
import { Layout } from 'antd';
import './App.css';
import { animated } from 'react-spring/renderprops'




class Home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };

  }

  render() {
    return (

      <animated.div style={{ ...this.props.transition, height: "95vh",  overflowY: "auto", backgroundColor: "rgba(0, 0, 0, 0.7)", border: "5px solid transparent", borderRadius: "20px" }}>
        <Layout style={{ margin: "20px",backgroundColor: "rgba(0, 0, 0, 0)" }}>
        <img alt="Sieberrsec Logo" src={require("./sieberrsec_ctf.svg").default} style={{ width: "100%", height: "100%", marginRight: "1vw" }}></img>
        <br/>
        <br/>
          <h2>Welcome to the Sieberrsec Training Platform!</h2>
          <h3>This platform is in early alpha. Do report any bugs you find :D!</h3>
          <br />
          <h4><u><b>General Rules for the platform:</b></u></h4>
          <p>
            - Do not attack the server infrastructrure in anyway, if you found an exploit, please report it immediately. <br />
          - Do not corrupt any challenges if you found a way to do so (that's just mean!)<br />
          - No sharing of flags/solutions in chats. Try to not spoil this experience for anyone :D (Feel free to ask for help though)<br />
          - If you need further clarification for any challenges, please contact the challenge author (whose name can be found in the challenge description)<br />
          - Have fun, enjoy yourselves and we hope you learnt something :)!<br />
          ~ <i>Sincerely, Sieberrsec 18/19 &amp; 19/20 &amp; 20/21</i>
          </p>

        </Layout>
      </animated.div>


    );
  }
}

export default Home;
