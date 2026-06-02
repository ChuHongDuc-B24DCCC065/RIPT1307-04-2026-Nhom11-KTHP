async function check() {
  try {
    const res = await fetch('http://localhost:5000/api/questions');
    if (!res.ok) {
        console.error(await res.text());
    } else {
        console.log(await res.json());
    }
  } catch (e) {
    console.error(e);
  }
}
check();
