import adapter from '@sveltejs/adapter-node';

const config = {
	kit: {
		adapter: adapter({
			out: 'build'
		}),
	}
};

export default config;
