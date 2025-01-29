import * as React from 'react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const About: React.FunctionComponent = () => {
  const [posts, setPosts] = useState<{ id: number; title: string; content: string; author: string }[]>([]);
  const [randomData, setRandomData] = useState<{ id: number; value: string } | null>(null);
  const apiEndpoint = "https://caller-api.onrender.com";
  useEffect(() => {
    axios.get(`${apiEndpoint}/random-posts`)
      .then(response => {
        setPosts(response.data);
      })
      .catch(error => {
        console.error('There was an error fetching the posts!', error);
      });

    const socket = io(apiEndpoint); // Adjust the URL as needed
    socket.on('randomData', (data) => {
      setRandomData(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className='absolute right-2 top-12'>
      <h1>This is About Page</h1>
      <Link to="/" className='text-blue-500'>
        Home page
      </Link>
      {randomData && (
        <div
          className='my-4 p-4 border rounded'
          style={{ backgroundColor: `#${Math.floor(Math.random() * 16777215).toString(16)}` }}
        >
          <h2 className='text-xl font-bold'>Random Data</h2>
          <p>ID: {randomData.id}</p>
          <p>Value: {randomData.value}</p>
        </div>
      )}
      <div>
        {posts.map(post => (
          <div key={post.id} className='my-4 p-4 border rounded'>
            <h2 className='text-xl font-bold'>{post.title}</h2>
            <p>{post.content}</p>
            <p className='text-gray-500'>Author: {post.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default About;