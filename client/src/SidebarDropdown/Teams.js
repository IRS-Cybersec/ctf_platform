import React from 'react';
import { Layout, message, Empty, Divider, Avatar, Table } from 'antd';
import { AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid, Label, ResponsiveContainer } from "recharts";
import { Ellipsis } from 'react-spinners-css';
import orderBy from 'lodash.orderby'
import {
    FileUnknownTwoTone,
} from '@ant-design/icons';
import { Link } from 'react-router-dom';

const { Column } = Table;


class Teams extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
        }
    }

    componentDidMount() {
        
    }

    render() {
        return (
            <Layout className="layout-style">
            </Layout>
        )
    }
}




export default Teams;
