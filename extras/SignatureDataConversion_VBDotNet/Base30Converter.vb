Imports System
Imports System.Collections.Generic
Imports System.Text

Namespace jSignature.Tools
    Public Class Base30Converter
        Private ALLCHARS As String = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWX"
        Private bitness As Integer
        Private MINUS As Char = "Z"
        Private PLUS As Char = "Y"
        Private charmap As Dictionary(Of Char, Integer)
        Private charmap_tail As Dictionary(Of Char, Integer)

        Public Sub New()
            bitness = ALLCHARS.Length / 2
            charmap = New Dictionary(Of Char, Integer)()
            charmap_tail = New Dictionary(Of Char, Integer)()

            For i As Integer = 0 To bitness - 1
                charmap.Add(ALLCHARS(i), i)
                charmap_tail.Add(ALLCHARS(i + bitness), i)
            Next
        End Sub

        Private Function FromBase30(ByVal data As List(Of Integer)) As Integer
            Dim len As Integer = data.Count

            If len = 1 Then
                Return data(0)
            Else
                data.Reverse()
                Dim answer As Double = data(0) + data(1) * bitness

                For i As Integer = 2 To len - 1
                    answer += data(i) * Math.Pow(bitness, i)
                Next

                Return CInt(answer)
            End If
        End Function

        Private Function ToBase30(ByVal val As Integer) As List(Of Integer)
            Dim retVal As List(Of Integer) = New List(Of Integer)()
            Dim pow As Integer = 0

            While Math.Pow(bitness, pow + 1) < val
                pow += 1
            End While

            Dim num As Integer = val

            While pow >= 0
                Dim mag As Integer = Convert.ToInt32(Math.Pow(bitness, pow))
                Dim div As Integer = num / mag
                retVal.Add(div)
                num -= (div * mag)
                pow -= 1
            End While

            Return retVal
        End Function

        Private Function CompressStrokeLeg(ByVal val As Integer()) As String
            Dim sb As StringBuilder = New StringBuilder()
            Dim polarity As Char = PLUS

            For Each num As Integer In val
                Dim cell As List(Of Integer) = ToBase30(Math.Abs(num))
                Dim newpolarity As Char

                If num = 0 Then
                    newpolarity = polarity
                Else
                    newpolarity = IIf(num >= 0, PLUS, MINUS)
                End If

                If newpolarity <> polarity Then
                    sb.Append(newpolarity)
                    polarity = newpolarity
                End If

                For i As Integer = 0 To cell.Count - 1
                    Dim charsetoffset As Integer = IIf(i > 0, bitness, 0)
                    sb.Append(ALLCHARS(cell(i) + charsetoffset))
                Next
            Next

            Return sb.ToString()
        End Function

        Public Function DecompressStrokeLeg(ByVal data As String) As Integer()
            Dim leg As List(Of Integer) = New List(Of Integer)()
            Dim cell As List(Of Integer) = New List(Of Integer)()
            Dim polarity As Integer = 1

            For Each c As Char In data

                If charmap_tail.ContainsKey(c) Then
                    cell.Add(charmap_tail(c))
                Else

                    If cell.Count <> 0 Then
                        leg.Add(FromBase30(cell) * polarity)
                    End If

                    cell.Clear()

                    If c = MINUS Then
                        polarity = -1
                    ElseIf c = PLUS Then
                        polarity = 1
                    Else
                        cell.Add(charmap(c))
                    End If
                End If
            Next

            leg.Add(FromBase30(cell) * polarity)
            Return leg.ToArray()
        End Function

        Private Function GetStroke(ByVal legX As String, ByVal legY As String) As Integer()()
            Dim X = DecompressStrokeLeg(legX)
            Dim Y = DecompressStrokeLeg(legY)
            Dim len As Integer = X.Length

            If len <> Y.Length Then
                Throw New Exception("Coordinate length for Y side of the stroke does not match the coordinate length of X side of the stroke")
            End If

            Dim l As List(Of Integer()) = New List(Of Integer())()

            For i As Integer = 0 To len - 1
                l.Add(New Integer() {X(i), Y(i)})
            Next

            Return l.ToArray()
        End Function

        Public Function Base30ToNative(ByVal data As String) As Integer()()()
            Dim ss As List(Of Integer()()) = New List(Of Integer()())()
            Dim parts As String() = data.Split("_")
            Dim len As Integer = parts.Length / 2

            For i As Integer = 0 To len - 1
                ss.Add(GetStroke(parts(i * 2), parts(i * 2 + 1)))
            Next

            Return ss.ToArray()
        End Function

        Public Function NativeToBase30(ByVal data As Integer()()()) As String
            Dim sb As StringBuilder = New StringBuilder()
            Dim LegX As List(Of Integer) = New List(Of Integer)()
            Dim LegY As List(Of Integer) = New List(Of Integer)()

            For Each stroke As Integer()() In data
                LegX.Clear()
                LegY.Clear()

                For Each line As Integer() In stroke
                    If line.Length <> 2 Then Throw New Exception("Invalid coordinate")
                    LegX.Add(line(0))
                    LegY.Add(line(1))
                Next

                If sb.Length > 0 Then sb.Append("_")
                sb.Append(CompressStrokeLeg(LegX.ToArray()))
                sb.Append("_")
                sb.Append(CompressStrokeLeg(LegY.ToArray()))
            Next

            Return sb.ToString()
        End Function
    End Class
End Namespace
