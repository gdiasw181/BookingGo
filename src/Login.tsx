
function login() {
    return (
        <form style={{ maxWidth: 360 }}>
            <h1>Sign in</h1>

            <label>
                Email                   
            </label>

            <label>
                Password
            </label>


            <button type="submit" style={{ marginTop: 16, padding: '8px 12px' }}>
                Sign in
            </button>
        </form>
    )
}