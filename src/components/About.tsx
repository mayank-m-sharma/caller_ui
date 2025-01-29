import * as React from 'react';
import {Link} from 'react-router-dom';
const About:React.FunctionComponent = () => {
  return (
    <div className='absolute right-2 top-12'>
        <h1>This is About Page</h1>
        <Link to="/" className='text-blue-500'>
            Home page
        </Link>
    </div>
  )
}

export default About