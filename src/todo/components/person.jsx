import React from 'react';
// import useForceUpdate from 'use-force-update';

const Person = ({ scrolling, person }) => {

	// const forceUpdate = useForceUpdate();

	const handleClick = () => {
		scrolling();
		forceUpdate();
	};

	return (
		<div className="person"
			onClick={handleClick}>{person.fname} {person.lname} {person.address}
		</div>
	);
};

export default Person;