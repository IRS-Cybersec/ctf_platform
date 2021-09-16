import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import gfm from 'remark-gfm';


function MarkdownRender(props) {
    const components = {
        code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
                <SyntaxHighlighter style={{ ...atomDark }} language={match[1]} PreTag="div" children={String(children).replace(/\n$/, '')} {...props} />
            ) : (
                <code className={className} {...props} children={String(children)} />
            )
        }
    }

    //rehypeRaw is to render HTML to support older challenge descriptions which were written in JSX
    //should be removed in the future
    return (
        <ReactMarkdown remarkPlugins={[gfm]} rehypePlugins={[rehypeRaw]} components={components} children={props.children} />
    );
}

export default MarkdownRender
