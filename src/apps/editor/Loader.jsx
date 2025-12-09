import { Html, useProgress } from '@react-three/drei';

const Loader = () => {
    const { progress } = useProgress(); // Track loading progress (percentage)

    return (
        <Html center>
            <div style={{ textAlign: 'center', color: 'white', fontSize: '20px' }}>
                <h1>Loading...</h1>
                <p>{Math.round(progress)}%</p> {/* Display the loading percentage */}
            </div>
        </Html>
    );
};

export default Loader;