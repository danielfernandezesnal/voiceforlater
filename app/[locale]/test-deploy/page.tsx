export const dynamic = 'force-dynamic'

export default function TestDeployPage() {
    return (
        <div className="p-10 text-center">
            <h1 className="text-3xl font-bold text-green-600">DEPLOY WORKS!</h1>
            <p className="mt-4 text-gray-600">Hash: {new Date().toISOString()}</p>
        </div>
    )
}
